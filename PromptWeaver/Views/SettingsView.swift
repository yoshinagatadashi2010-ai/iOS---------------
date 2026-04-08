import SwiftUI

struct SettingsView: View {
    @StateObject private var viewModel = SettingsViewModel()

    var body: some View {
        Form {
            Section("既定値") {
                Picker("既定の言語", selection: $viewModel.defaultLanguage) {
                    ForEach(PromptLanguage.allCases) { language in
                        Text(language.displayName).tag(language)
                    }
                }
                .onChange(of: viewModel.defaultLanguage) { _, language in
                    viewModel.updateDefaultLanguage(language)
                }
            }

            Section("iCloud Drive 反映") {
                Toggle("書き出しを有効にする", isOn: $viewModel.isICloudDriveReflectionEnabled)
                    .onChange(of: viewModel.isICloudDriveReflectionEnabled) { _, isEnabled in
                        viewModel.updateReflectionEnabled(isEnabled)
                    }

                VStack(alignment: .leading, spacing: 8) {
                    Text("出力先")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text(viewModel.exportFolderDescription)
                        .font(.footnote)
                        .textSelection(.enabled)
                }

                Text("保存や更新のあと、Markdown と JSON を iCloud Drive に反映します。Windows では iCloud for Windows から同じファイルを参照できます。")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("今後の予定") {
                ForEach(viewModel.futureOptions, id: \.self) { option in
                    Text(option)
                }
            }
        }
        .navigationTitle("設定")
        .navigationBarTitleDisplayMode(.inline)
    }
}
