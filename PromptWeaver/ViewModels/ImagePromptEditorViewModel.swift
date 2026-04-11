import Foundation
import Combine
import PhotosUI
import UIKit

@MainActor
final class ImagePromptEditorViewModel: ObservableObject {
    @Published var state: ImagePromptEditorState
    @Published private(set) var saveState: EditorSaveState = .idle
    @Published private(set) var isImportingReferenceImage = false
    @Published private(set) var referenceImagePreview: UIImage?
    @Published var errorMessage: String?

    let projectID: UUID

    private let createdAt: Date
    private let repository: PromptProjectRepository
    private let syncCoordinator: SyncCoordinator
    private let markdownGenerator: PromptMarkdownGenerator
    private var autosaveTask: Task<Void, Never>?

    init(
        projectID: UUID? = nil,
        repository: PromptProjectRepository = AppContainer.shared.repository,
        settingsStore: SettingsStore = AppContainer.shared.settingsStore,
        syncCoordinator: SyncCoordinator = AppContainer.shared.syncCoordinator,
        markdownGenerator: PromptMarkdownGenerator = AppContainer.shared.markdownGenerator
    ) {
        self.repository = repository
        self.syncCoordinator = syncCoordinator
        self.markdownGenerator = markdownGenerator

        if
            let projectID,
            let snapshot = try? repository.fetchProject(id: projectID)
        {
            self.projectID = snapshot.id
            createdAt = snapshot.createdAt
            state = ImagePromptEditorState(snapshot: snapshot)
            referenceImagePreview = Self.makePreviewImage(from: snapshot.imageDetail?.referenceImageData)
            saveState = .saved(snapshot.updatedAt)
        } else {
            let now = Date.now
            self.projectID = projectID ?? UUID()
            createdAt = now
            state = ImagePromptEditorState(defaultLanguage: settingsStore.defaultLanguage)
            referenceImagePreview = nil
        }
    }

    deinit {
        autosaveTask?.cancel()
    }

    var navigationTitle: String {
        state.metadata.title.trimmedOrNil ?? "画像プロンプト"
    }

    var currentSnapshot: PromptProjectSnapshot {
        state.makeSnapshot(id: projectID, createdAt: createdAt)
    }

    var markdownPreview: String {
        markdownGenerator.generateMarkdown(from: currentSnapshot)
    }

    var referenceImageSummary: String? {
        guard let data = state.referenceImageData else {
            return nil
        }

        let size = ByteCountFormatter.string(fromByteCount: Int64(data.count), countStyle: .file)
        if let filename = state.referenceImageFilename?.trimmedOrNil {
            return "\(filename) ・ \(size)"
        }
        return size
    }

    func scheduleAutosave() {
        saveState = .saving
        autosaveTask?.cancel()
        autosaveTask = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(700))
            guard let self, !Task.isCancelled else {
                return
            }
            await self.persist()
        }
    }

    func saveNow() {
        autosaveTask?.cancel()
        Task { [weak self] in
            await self?.persist()
        }
    }

    func importReferenceImage(from item: PhotosPickerItem?) async {
        guard let item else {
            return
        }

        isImportingReferenceImage = true
        defer { isImportingReferenceImage = false }

        do {
            guard let data = try await item.loadTransferable(type: Data.self) else {
                throw ReferenceImageImportError.loadFailed
            }

            let filename = item.supportedContentTypes.first?.preferredFilenameExtension.map {
                "photo.\($0)"
            }
            try applyReferenceImage(data: data, filename: filename)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func importReferenceImage(from url: URL) async {
        isImportingReferenceImage = true
        let didAccessResource = url.startAccessingSecurityScopedResource()
        defer {
            if didAccessResource {
                url.stopAccessingSecurityScopedResource()
            }
            isImportingReferenceImage = false
        }

        do {
            let data = try await Task.detached(priority: .userInitiated) {
                try Data(contentsOf: url)
            }.value

            try applyReferenceImage(data: data, filename: url.lastPathComponent)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func removeReferenceImage() {
        state.referenceImageData = nil
        state.referenceImageFilename = nil
        referenceImagePreview = nil
    }

    func persist() {
        do {
            let savedSnapshot = try repository.saveProject(snapshot: currentSnapshot)
            state = ImagePromptEditorState(snapshot: savedSnapshot)
            referenceImagePreview = Self.makePreviewImage(from: savedSnapshot.imageDetail?.referenceImageData)
            saveState = .saved(savedSnapshot.updatedAt)
            syncCoordinator.projectDidSave(savedSnapshot)
        } catch {
            saveState = .failed(error.localizedDescription)
            errorMessage = error.localizedDescription
        }
    }

    private func applyReferenceImage(data: Data, filename: String?) throws {
        guard let preview = Self.makePreviewImage(from: data) else {
            throw ReferenceImageImportError.unsupportedFile
        }

        state.referenceImageData = data
        state.referenceImageFilename = filename?.trimmedOrNil
        referenceImagePreview = preview
    }

    private static func makePreviewImage(from data: Data?) -> UIImage? {
        guard let data else {
            return nil
        }

        return UIImage(data: data)
    }
}

private enum ReferenceImageImportError: LocalizedError {
    case loadFailed
    case unsupportedFile

    var errorDescription: String? {
        switch self {
        case .loadFailed:
            return "参照画像を読み込めませんでした。別の画像でお試しください。"
        case .unsupportedFile:
            return "対応していない画像形式です。"
        }
    }
}
