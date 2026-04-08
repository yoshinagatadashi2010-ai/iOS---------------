import Foundation
import Combine

@MainActor
final class ProjectListViewModel: ObservableObject {
    @Published var searchText: String = ""
    @Published var selectedFilter: ProjectListFilter = .all
    @Published var selectedSort: ProjectSortOption = .updatedDescending
    @Published private(set) var projects: [PromptProjectSnapshot] = []
    @Published var errorMessage: String?

    private let repository: PromptProjectRepository
    private let syncCoordinator: SyncCoordinator

    init(
        repository: PromptProjectRepository = AppContainer.shared.repository,
        syncCoordinator: SyncCoordinator = AppContainer.shared.syncCoordinator
    ) {
        self.repository = repository
        self.syncCoordinator = syncCoordinator
    }

    func load() {
        do {
            projects = try repository.fetchProjects(
                searchText: searchText,
                filter: selectedFilter,
                sort: selectedSort
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func toggleFavorite(_ project: PromptProjectSnapshot) {
        do {
            _ = try repository.updateFavorite(id: project.id, isFavorite: !project.favorite)
            load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func duplicate(_ project: PromptProjectSnapshot) {
        do {
            if let duplicated = try repository.duplicateProject(id: project.id) {
                syncCoordinator.projectDidSave(duplicated)
            }
            load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func delete(_ project: PromptProjectSnapshot) {
        do {
            if let deleted = try repository.deleteProject(id: project.id) {
                syncCoordinator.projectDidDelete(deleted.id)
            }
            load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

