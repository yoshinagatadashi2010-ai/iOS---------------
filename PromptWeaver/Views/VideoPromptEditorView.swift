import SwiftUI

struct VideoPromptEditorView: View {
    @StateObject private var viewModel: VideoPromptEditorViewModel
    @State private var isPreviewPresented = false

    init(projectID: UUID? = nil) {
        _viewModel = StateObject(wrappedValue: VideoPromptEditorViewModel(projectID: projectID))
    }

    var body: some View {
        Form {
            SharedProjectFieldsSection(metadata: $viewModel.state.metadata)

            Section("動画全体") {
                TextField("全体コンセプト", text: $viewModel.state.overallConcept)
                TextField("ビジュアルスタイル", text: $viewModel.state.visualStyle)
                TextField("テンポ", text: $viewModel.state.pacing)
                TextField("アスペクト比", text: $viewModel.state.aspectRatio)
            }

            Section {
                HStack {
                    Text("合計尺")
                    Spacer()
                    Text(viewModel.totalDurationLabel)
                        .foregroundStyle(.secondary)
                }

                Button {
                    viewModel.addScene()
                } label: {
                    Label("シーンを追加", systemImage: "plus")
                }
            } header: {
                Text("シーン")
            } footer: {
                Text("編集ボタンを押すと並べ替えできます。")
            }

            ForEach($viewModel.state.scenes) { $scene in
                NavigationLink {
                    SceneEditorView(scene: $scene)
                } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(scene.title.trimmedOrNil ?? "シーン \(scene.orderIndex + 1)")
                            .font(.headline)
                        Text("\(max(1, scene.durationSeconds))秒")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                    Button("複製") {
                        viewModel.duplicateScene(scene)
                    }
                    .tint(.blue)

                    Button("削除", role: .destructive) {
                        viewModel.deleteScene(id: scene.id)
                    }
                }
            }
            .onMove(perform: viewModel.moveScenes)

            Section("補足") {
                LabeledTextEditor(
                    title: "ネガティブプロンプト",
                    text: $viewModel.state.negativePrompt,
                    prompt: "避けたい描写やノイズ要因をまとめます"
                )

                LabeledTextEditor(
                    title: "プロジェクトメモ",
                    text: $viewModel.state.notes,
                    prompt: "制作メモや演出方針を自由に残します"
                )
            }
        }
        .navigationTitle(viewModel.navigationTitle)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                EditButton()

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
