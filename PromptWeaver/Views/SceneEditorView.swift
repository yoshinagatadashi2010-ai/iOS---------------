import SwiftUI

struct SceneEditorView: View {
    @Binding var scene: VideoSceneEditorState
    @State private var isDetailExpanded = true

    var body: some View {
        Form {
            Section("シーン基本情報") {
                TextField("シーンタイトル", text: $scene.title)

                Stepper(value: $scene.durationSeconds, in: 1 ... 600) {
                    Text("長さ: \(scene.durationSeconds)秒")
                }

                LabeledTextEditor(
                    title: "内容",
                    text: $scene.content,
                    prompt: "このシーンで起きることを具体的に書きます"
                )
            }

            Section("ビジュアル") {
                TextField("カメラワーク", text: $scene.cameraWork)
                TextField("被写体の動き", text: $scene.subjectMotion)
                TextField("背景", text: $scene.background)
                TextField("ムード", text: $scene.mood)
            }

            DisclosureGroup("詳細メモ", isExpanded: $isDetailExpanded) {
                LabeledTextEditor(
                    title: "音のメモ",
                    text: $scene.soundNote,
                    prompt: "BGMやSEなどがあれば残します"
                )

                LabeledTextEditor(
                    title: "トランジション",
                    text: $scene.transitionNote,
                    prompt: "前後のつなぎ方を必要に応じて記録します"
                )

                LabeledTextEditor(
                    title: "補足メモ",
                    text: $scene.notes,
                    prompt: "制作メモや注意点を残します"
                )
            }
        }
        .navigationTitle(scene.title.trimmedOrNil ?? "シーン")
        .navigationBarTitleDisplayMode(.inline)
    }
}
