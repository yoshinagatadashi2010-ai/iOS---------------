import Foundation
import Combine

@MainActor
final class ImagePromptEditorViewModel: ObservableObject {
    @Published var state: ImagePromptEditorState
    @Published private(set) var saveState: EditorSaveState = .idle
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
            saveState = .saved(snapshot.updatedAt)
        } else {
            let now = Date.now
            self.projectID = projectID ?? UUID()
            createdAt = now
            state = ImagePromptEditorState(defaultLanguage: settingsStore.defaultLanguage)
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

    func persist() {
        do {
            let savedSnapshot = try repository.saveProject(snapshot: currentSnapshot)
            state = ImagePromptEditorState(snapshot: savedSnapshot)
            saveState = .saved(savedSnapshot.updatedAt)
            syncCoordinator.projectDidSave(savedSnapshot)
        } catch {
            saveState = .failed(error.localizedDescription)
            errorMessage = error.localizedDescription
        }
    }
}



