import Foundation
import Combine

@MainActor
final class HomeViewModel: ObservableObject {
    @Published private(set) var recentProjects: [PromptProjectSnapshot] = []
    @Published private(set) var favoriteProjects: [PromptProjectSnapshot] = []
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
            recentProjects = try repository.fetchRecentProjects(limit: 8)
            favoriteProjects = try repository.fetchFavoriteProjects(limit: 8)
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

