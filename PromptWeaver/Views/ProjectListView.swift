import SwiftUI

struct ProjectListView: View {
    @StateObject private var viewModel = ProjectListViewModel()

    var body: some View {
        List {
            Section {
                Picker("種類", selection: $viewModel.selectedFilter) {
                    ForEach(ProjectListFilter.allCases) { filter in
                        Text(filter.displayName).tag(filter)
                    }
                }
                .pickerStyle(.segmented)
            }

            if viewModel.projects.isEmpty {
                ContentUnavailableView(
                    "一致するプロジェクトがありません",
                    systemImage: "magnifyingglass",
                    description: Text("検索語やフィルターを調整してください。")
                )
            } else {
                ForEach(viewModel.projects) { project in
                    NavigationLink {
                        ProjectEditorDestinationView(projectID: project.id, projectType: project.projectType)
                    } label: {
                        ProjectRowView(project: project) {
                            viewModel.toggleFavorite(project)
                        }
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        Button("複製") {
                            viewModel.duplicate(project)
                        }
                        .tint(.blue)

                        Button("削除", role: .destructive) {
                            viewModel.delete(project)
                        }
                    }
                }
            }
        }
        .navigationTitle("プロジェクト")
        .searchable(text: $viewModel.searchText, prompt: "タイトルまたはタグで検索")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Picker("並び順", selection: $viewModel.selectedSort) {
                        ForEach(ProjectSortOption.allCases) { option in
                            Text(option.displayName).tag(option)
                        }
                    }
                } label: {
                    Label("並び順", systemImage: "arrow.up.arrow.down")
                }
            }
        }
        .task { viewModel.load() }
        .onChange(of: viewModel.searchText) { _, _ in viewModel.load() }
        .onChange(of: viewModel.selectedFilter) { _, _ in viewModel.load() }
        .onChange(of: viewModel.selectedSort) { _, _ in viewModel.load() }
        .alert("一覧エラー", isPresented: Binding(
            get: { viewModel.errorMessage != nil },
            set: { if !$0 { viewModel.errorMessage = nil } }
        )) {
            Button("閉じる", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage ?? "不明なエラー")
        }
    }
}
