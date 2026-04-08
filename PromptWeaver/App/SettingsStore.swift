import Foundation
import Combine

@MainActor
final class SettingsStore: ObservableObject {
    private enum Keys {
        static let defaultLanguage = "settings.defaultLanguage"
        static let iCloudDriveReflectionEnabled = "settings.iCloudDriveReflectionEnabled"
    }

    @Published var defaultLanguage: PromptLanguage {
        didSet {
            userDefaults.set(defaultLanguage.rawValue, forKey: Keys.defaultLanguage)
        }
    }

    @Published var isICloudDriveReflectionEnabled: Bool {
        didSet {
            userDefaults.set(isICloudDriveReflectionEnabled, forKey: Keys.iCloudDriveReflectionEnabled)
        }
    }

    private let userDefaults: UserDefaults

    init(userDefaults: UserDefaults = .standard) {
        self.userDefaults = userDefaults
        let savedLanguage = userDefaults.string(forKey: Keys.defaultLanguage).flatMap(PromptLanguage.init(rawValue:)) ?? .japanese
        defaultLanguage = savedLanguage
        isICloudDriveReflectionEnabled = userDefaults.object(forKey: Keys.iCloudDriveReflectionEnabled) as? Bool ?? true
    }
}

