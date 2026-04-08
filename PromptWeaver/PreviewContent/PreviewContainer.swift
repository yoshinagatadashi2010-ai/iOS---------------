import SwiftData

enum PreviewContainer {
    @MainActor
    static var modelContainer: ModelContainer {
        PersistenceController.preview.container
    }
}
