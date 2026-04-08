import SwiftUI

struct SharedProjectFieldsSection: View {
    @Binding var metadata: ProjectMetadataEditorState

    var body: some View {
        Section("基本情報") {
            TextField("タイトル", text: $metadata.title)

            LabeledTextEditor(
                title: "概要",
                text: $metadata.summary,
                prompt: "このプロジェクトの狙いや用途を短くまとめます"
            )

            TextField("タグ（カンマ区切り）", text: $metadata.tagsText)
                .textInputAutocapitalization(.never)

            Toggle("お気に入り", isOn: $metadata.favorite)
            Toggle("アーカイブ", isOn: $metadata.archived)

            Picker("言語", selection: $metadata.language) {
                ForEach(PromptLanguage.allCases) { language in
                    Text(language.displayName).tag(language)
                }
            }

            Picker("出力形式", selection: $metadata.outputFormat) {
                ForEach(PromptOutputFormat.allCases) { format in
                    Text(format.displayName).tag(format)
                }
            }
        }
    }
}
