import SwiftUI

struct ImagePromptEditorView: View {
    @StateObject private var viewModel: ImagePromptEditorViewModel
    @State private var isPreviewPresented = false

    init(projectID: UUID? = nil) {
        _viewModel = StateObject(wrappedValue: ImagePromptEditorViewModel(projectID: projectID))
    }

    var body: some View {
        Form {
            SharedProjectFieldsSection(metadata: $viewModel.state.metadata)

            Section("画像プロンプト") {
                TextField("被写体", text: $viewModel.state.subject)
                TextField("構図", text: $viewModel.state.composition)
                TextField("スタイル", text: $viewModel.state.style)
                TextField("ライティング", text: $viewModel.state.lighting)
                TextField("カメラ", text: $viewModel.state.camera)
                TextField("色調", text: $viewModel.state.colorTone)
                TextField("ムード", text: $viewModel.state.mood)
                TextField("環境", text: $viewModel.state.environment)
            }

            Section("補足") {
                LabeledTextEditor(
                    title: "ネガティブプロンプト",
                    text: $viewModel.state.negativePrompt,
                    prompt: "避けたい要素や品質上の禁止事項をまとめます"
                )

                LabeledTextEditor(
                    title: "メモ",
                    text: $viewModel.state.notes,
                    prompt: "撮影意図、参照イメージ、注意点などを自由に書けます"
                )
            }
        }
        .navigationTitle(viewModel.navigationTitle)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    isPreviewPresented = true
                } label: {
                    Label("プレビュー", systemImage: "doc.text.magnifyingglass")
                }
            }

            ToolbarItem(placement: .bottomBar) {
                Text(viewModel.saveState.label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .onChange(of: viewModel.state) { _, _ in
            viewModel.scheduleAutosave()
        }
        .onDisappear {
            viewModel.saveNow()
        }
        .sheet(isPresented: $isPreviewPresented) {
            NavigationStack {
                MarkdownPreviewView(snapshot: viewModel.currentSnapshot)
            }
        }
        .alert("保存エラー", isPresented: Binding(
            get: { viewModel.errorMessage != nil },
            set: { if !$0 { viewModel.errorMessage = nil } }
        )) {
            Button("閉じる", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage ?? "不明なエラー")
        }
    }
}
