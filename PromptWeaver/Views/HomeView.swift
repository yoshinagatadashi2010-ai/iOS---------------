import SwiftUI

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(spacing: 12) {
                    NavigationLink {
                        ImagePromptEditorView()
                    } label: {
                        Label("新しい画像プロンプト", systemImage: "photo.badge.plus")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)

                    NavigationLink {
                        VideoPromptEditorView()
                    } label: {
                        Label("新しい動画プロンプト", systemImage: "video.badge.plus")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("最近のプロジェクト")
                        .font(.title3.bold())

                    if viewModel.recentProjects.isEmpty {
                        Text("まだプロジェクトがありません。まずは1本作ってみましょう。")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(viewModel.recentProjects) { project in
                            NavigationLink {
                                ProjectEditorDestinationView(projectID: project.id, projectType: project.projectType)
                            } label: {
                                ProjectRowView(project: project) {
                                    viewModel.toggleFavorite(project)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("お気に入り")
                        .font(.title3.bold())

                    if viewModel.favoriteProjects.isEmpty {
                        Text("お気に入りにしたプロジェクトがここに並びます。")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(viewModel.favoriteProjects) { project in
                            NavigationLink {
                                ProjectEditorDestinationView(projectID: project.id, projectType: project.projectType)
                            } label: {
                                ProjectRowView(project: project) {
                                    viewModel.toggleFavorite(project)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("PromptWeaver")
        .task { viewModel.load() }
        .refreshable { viewModel.load() }
        .alert("読み込みエラー", isPresented: Binding(
            get: { viewModel.errorMessage != nil },
            set: { if !$0 { viewModel.errorMessage = nil } }
        )) {
            Button("閉じる", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage ?? "不明なエラー")
        }
    }
}
