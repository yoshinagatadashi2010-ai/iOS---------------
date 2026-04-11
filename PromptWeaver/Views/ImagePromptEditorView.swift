import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

struct ImagePromptEditorView: View {
    @StateObject private var viewModel: ImagePromptEditorViewModel
    @State private var isPreviewPresented = false
    @State private var selectedReferencePhoto: PhotosPickerItem?
    @State private var isReferenceFileImporterPresented = false

    init(projectID: UUID? = nil) {
        _viewModel = StateObject(wrappedValue: ImagePromptEditorViewModel(projectID: projectID))
    }

    var body: some View {
        Form {
            SharedProjectFieldsSection(metadata: $viewModel.state.metadata)

            Section("参照画像") {
                VStack(alignment: .leading, spacing: 12) {
                    if let preview = viewModel.referenceImagePreview {
                        Image(uiImage: preview)
                            .resizable()
                            .scaledToFit()
                            .frame(maxWidth: .infinity)
                            .clipShape(RoundedRectangle(cornerRadius: 16))

                        if let summary = viewModel.referenceImageSummary {
                            Text(summary)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    } else {
                        Label("写真アプリまたはファイルから参照画像を追加できます", systemImage: "photo.badge.plus")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    HStack {
                        PhotosPicker(selection: $selectedReferencePhoto, matching: .images) {
                            Label(
                                viewModel.referenceImagePreview == nil ? "写真から追加" : "写真を変更",
                                systemImage: "photo.on.rectangle"
                            )
                            .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)

                        Button {
                            isReferenceFileImporterPresented = true
                        } label: {
                            Label(
                                viewModel.referenceImagePreview == nil ? "ファイルから追加" : "ファイルを変更",
                                systemImage: "folder"
                            )
                            .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }

                    if viewModel.referenceImagePreview != nil {
                        Button(role: .destructive) {
                            viewModel.removeReferenceImage()
                        } label: {
                            Label("参照画像を削除", systemImage: "trash")
                        }
                    }

                    if viewModel.isImportingReferenceImage {
                        ProgressView("画像を読み込み中")
                            .font(.caption)
                    } else {
                        Text("参照画像は1枚だけ保存され、プロジェクトと一緒に保持されます。")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
            }

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
        .onReceive(viewModel.$state.dropFirst()) { _ in
            viewModel.scheduleAutosave()
        }
        .onChange(of: selectedReferencePhoto) { _, newValue in
            Task {
                await viewModel.importReferenceImage(from: newValue)
                selectedReferencePhoto = nil
            }
        }
        .onDisappear {
            viewModel.saveNow()
        }
        .sheet(isPresented: $isPreviewPresented) {
            NavigationStack {
                MarkdownPreviewView(snapshot: viewModel.currentSnapshot)
            }
        }
        .fileImporter(
            isPresented: $isReferenceFileImporterPresented,
            allowedContentTypes: [.image],
            allowsMultipleSelection: false
        ) { result in
            guard case let .success(urls) = result, let url = urls.first else {
                return
            }

            Task {
                await viewModel.importReferenceImage(from: url)
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
