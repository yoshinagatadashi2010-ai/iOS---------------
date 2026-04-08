import Foundation
import Combine

@MainActor
final class VideoPromptEditorViewModel: ObservableObject {
    @Published var state: VideoPromptEditorState
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
            state = VideoPromptEditorState(snapshot: snapshot)
            saveState = .saved(snapshot.updatedAt)
        } else {
            let now = Date.now
            self.projectID = projectID ?? UUID()
            createdAt = now
            state = VideoPromptEditorState(defaultLanguage: settingsStore.defaultLanguage)
        }
    }

    deinit {
        autosaveTask?.cancel()
    }

    var navigationTitle: String {
        state.metadata.title.trimmedOrNil ?? "動画プロンプト"
    }

    var currentSnapshot: PromptProjectSnapshot {
        state.makeSnapshot(id: projectID, createdAt: createdAt)
    }

    var markdownPreview: String {
        markdownGenerator.generateMarkdown(from: currentSnapshot)
    }

    var totalDurationLabel: String {
        "合計 \(state.totalDurationSeconds)秒"
    }

    func addScene() {
        state.scenes.append(VideoSceneEditorState(orderIndex: state.scenes.count))
        scheduleAutosave()
    }

    func duplicateScene(_ scene: VideoSceneEditorState) {
        guard let index = state.scenes.firstIndex(where: { $0.id == scene.id }) else {
            return
        }

        var duplicated = scene
        duplicated.id = UUID()
        duplicated.title = duplicated.title.trimmedOrNil.map { "\($0) のコピー" } ?? "シーンのコピー"
        state.scenes.insert(duplicated, at: index + 1)
        reindexScenes()
        scheduleAutosave()
    }

    func deleteScene(id: UUID) {
        state.scenes.removeAll { $0.id == id }
        reindexScenes()
        scheduleAutosave()
    }

    func moveScenes(from source: IndexSet, to destination: Int) {
        move(items: &state.scenes, from: source, to: destination)
        reindexScenes()
        scheduleAutosave()
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
            state = VideoPromptEditorState(snapshot: savedSnapshot)
            saveState = .saved(savedSnapshot.updatedAt)
            syncCoordinator.projectDidSave(savedSnapshot)
        } catch {
            saveState = .failed(error.localizedDescription)
            errorMessage = error.localizedDescription
        }
    }

    private func reindexScenes() {
        for index in state.scenes.indices {
            state.scenes[index].orderIndex = index
            state.scenes[index].durationSeconds = max(1, state.scenes[index].durationSeconds)
        }
    }

    private func move(items: inout [VideoSceneEditorState], from source: IndexSet, to destination: Int) {
        let sortedSource = source.sorted()
        let movingItems = sortedSource.map { items[$0] }

        for index in sortedSource.reversed() {
            items.remove(at: index)
        }

        var target = destination
        for index in sortedSource where index < destination {
            target -= 1
        }

        items.insert(contentsOf: movingItems, at: max(0, min(target, items.count)))
    }
}



