import SwiftUI

struct ProjectEditorDestinationView: View {
    let projectID: UUID
    let projectType: PromptProjectType

    var body: some View {
        switch projectType {
        case .image:
            ImagePromptEditorView(projectID: projectID)
        case .video:
            VideoPromptEditorView(projectID: projectID)
        case .audio, .storyboard, .multimodal:
            ContentUnavailableView(
                "この種類はまだ未対応です",
                systemImage: "hammer",
                description: Text("今のMVPでは画像と動画のプロンプト編集に対応しています。")
            )
        }
    }
}
