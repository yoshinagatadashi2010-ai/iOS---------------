import Foundation
import SwiftData

@MainActor
final class PersistenceController {
    static let shared = PersistenceController()
    static let preview = PersistenceController(inMemory: true, seedPreviewData: true)

    let container: ModelContainer

    private init(inMemory: Bool = false, seedPreviewData: Bool = false) {
        let schema = Schema([
            PromptProject.self,
            ImagePromptDetail.self,
            VideoPromptDetail.self,
            VideoScene.self
        ])

        do {
            if inMemory {
                let configuration = ModelConfiguration(
                    "PromptWeaverPreview",
                    isStoredInMemoryOnly: true
                )
                container = try ModelContainer(for: schema, configurations: configuration)
            } else {
                do {
                    // TODO: CloudKit/iCloud Driveを使うには、実アプリのBundle IDに合わせたentitlements設定が必要です。
                    let cloudConfiguration = ModelConfiguration(
                        "PromptWeaver",
                        cloudKitDatabase: .automatic
                    )
                    container = try ModelContainer(for: schema, configurations: cloudConfiguration)
                } catch {
                    let localConfiguration = ModelConfiguration("PromptWeaverLocal")
                    container = try ModelContainer(for: schema, configurations: localConfiguration)
                }
            }
        } catch {
            fatalError("ModelContainerの初期化に失敗しました: \(error.localizedDescription)")
        }

        if seedPreviewData {
            PreviewSampleData.seedIfNeeded(into: container.mainContext)
        }
    }
}
