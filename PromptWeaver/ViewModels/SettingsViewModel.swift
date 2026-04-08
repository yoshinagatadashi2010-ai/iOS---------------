import Foundation
import Combine

@MainActor
final class SettingsViewModel: ObservableObject {
    @Published var defaultLanguage: PromptLanguage
    @Published var isICloudDriveReflectionEnabled: Bool
    @Published private(set) var exportFolderDescription: String = "iCloud Drive / PromptWeaver / Exports"

    let futureOptions = [
        "JSON / Markdown からの読み込み",
        "AIサービス別テンプレート切り替え",
        "Windows 側ファイルとの差分取り込み"
    ]

    private let settingsStore: SettingsStore
    private let reflectionCoordinator: ICloudDriveReflectionCoordinator

    init(
        settingsStore: SettingsStore = AppContainer.shared.settingsStore,
        reflectionCoordinator: ICloudDriveReflectionCoordinator = AppContainer.shared.reflectionCoordinator
    ) {
        self.settingsStore = settingsStore
        self.reflectionCoordinator = reflectionCoordinator
        defaultLanguage = settingsStore.defaultLanguage
        isICloudDriveReflectionEnabled = settingsStore.isICloudDriveReflectionEnabled
        refreshExportFolderDescription()
    }

    func updateDefaultLanguage(_ language: PromptLanguage) {
        defaultLanguage = language
        settingsStore.defaultLanguage = language
    }

    func updateReflectionEnabled(_ isEnabled: Bool) {
        isICloudDriveReflectionEnabled = isEnabled
        settingsStore.isICloudDriveReflectionEnabled = isEnabled
    }

    func refreshExportFolderDescription() {
        Task { [weak self] in
            guard let self else {
                return
            }
            let description = await self.reflectionCoordinator.exportFolderDescription()
            self.exportFolderDescription = description
        }
    }
}

