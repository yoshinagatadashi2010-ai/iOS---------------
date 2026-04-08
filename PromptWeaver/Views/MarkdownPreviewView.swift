import SwiftUI

struct MarkdownPreviewView: View {
    @StateObject private var viewModel: MarkdownPreviewViewModel
    @State private var markdownExport: PreparedExport?
    @State private var jsonExport: PreparedExport?

    init(snapshot: PromptProjectSnapshot) {
        _viewModel = StateObject(wrappedValue: MarkdownPreviewViewModel(snapshot: snapshot))
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                Text(viewModel.markdown)
                    .font(.system(.body, design: .monospaced))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
            }

            Divider()

            VStack(spacing: 12) {
                HStack(spacing: 12) {
                    Button {
                        viewModel.copyToPasteboard()
                    } label: {
                        Label("コピー", systemImage: "doc.on.doc")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)

                    ShareLink(item: viewModel.markdown) {
                        Label("共有", systemImage: "square.and.arrow.up")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                }

                HStack(spacing: 12) {
                    Button {
                        markdownExport = viewModel.makeMarkdownExport()
                    } label: {
                        Label("Markdownを書き出す", systemImage: "arrow.down.doc")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)

                    Button {
                        jsonExport = viewModel.makeJSONExport()
                    } label: {
                        Label("JSONを書き出す", systemImage: "curlybraces")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
            }
            .padding()
        }
        .navigationTitle("Markdownプレビュー")
        .navigationBarTitleDisplayMode(.inline)
        .fileExporter(
            isPresented: Binding(
                get: { markdownExport != nil },
                set: { if !$0 { markdownExport = nil } }
            ),
            document: markdownExport?.document ?? ExportDocument(data: Data(), contentType: .markdown),
            contentType: markdownExport?.document.contentType ?? .markdown,
            defaultFilename: exportName(from: markdownExport?.filename)
        ) { _ in
            markdownExport = nil
        }
        .fileExporter(
            isPresented: Binding(
                get: { jsonExport != nil },
                set: { if !$0 { jsonExport = nil } }
            ),
            document: jsonExport?.document ?? ExportDocument(data: Data(), contentType: .json),
            contentType: jsonExport?.document.contentType ?? .json,
            defaultFilename: exportName(from: jsonExport?.filename)
        ) { _ in
            jsonExport = nil
        }
        .alert("書き出しエラー", isPresented: Binding(
            get: { viewModel.errorMessage != nil },
            set: { if !$0 { viewModel.errorMessage = nil } }
        )) {
            Button("閉じる", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage ?? "不明なエラー")
        }
    }

    private func exportName(from filename: String?) -> String {
        guard let filename else {
            return "PromptWeaver"
        }
        return URL(fileURLWithPath: filename).deletingPathExtension().lastPathComponent
    }
}
