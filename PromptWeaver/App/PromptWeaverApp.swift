import SwiftUI

@main
struct PromptWeaverApp: App {
    private let container = AppContainer.shared

    var body: some Scene {
        WindowGroup {
            RootTabView()
        }
        .modelContainer(container.persistenceController.container)
    }
}
