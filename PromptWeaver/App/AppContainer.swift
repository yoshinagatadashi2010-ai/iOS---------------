import Foundation

@MainActor
final class AppContainer {
    static let shared = AppContainer()

    let persistenceController: PersistenceController
    let settingsStore: SettingsStore
    let repository: SwiftDataPromptProjectRepository
    let markdownGenerator: DefaultPromptMarkdownGenerator
    let markdownExporter: MarkdownFileExporter
    let jsonExporter: JSONFileExporter
    let reflectionCoordinator: ICloudDriveReflectionCoordinator
    let syncCoordinator: SyncCoordinator

    private init() {
        persistenceController = .shared
        settingsStore = SettingsStore()
        repository = SwiftDataPromptProjectRepository(modelContext: persistenceController.container.mainContext)
        markdownGenerator = DefaultPromptMarkdownGenerator()
        markdownExporter = MarkdownFileExporter(markdownGenerator: markdownGenerator)
        jsonExporter = JSONFileExporter()
        reflectionCoordinator = ICloudDriveReflectionCoordinator(
            markdownExporter: markdownExporter,
            jsonExporter: jsonExporter
        )
        syncCoordinator = SyncCoordinator(
            settingsStore: settingsStore,
            reflectionCoordinator: reflectionCoordinator
        )
    }
}
