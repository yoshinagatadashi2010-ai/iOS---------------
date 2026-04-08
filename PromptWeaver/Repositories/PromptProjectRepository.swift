import Foundation

@MainActor
protocol PromptProjectRepository: AnyObject {
    func fetchProjects(searchText: String, filter: ProjectListFilter, sort: ProjectSortOption) throws -> [PromptProjectSnapshot]
    func fetchProject(id: UUID) throws -> PromptProjectSnapshot?
    func fetchRecentProjects(limit: Int) throws -> [PromptProjectSnapshot]
    func fetchFavoriteProjects(limit: Int?) throws -> [PromptProjectSnapshot]
    func saveProject(snapshot: PromptProjectSnapshot) throws -> PromptProjectSnapshot
    func updateFavorite(id: UUID, isFavorite: Bool) throws -> PromptProjectSnapshot?
    func duplicateProject(id: UUID) throws -> PromptProjectSnapshot?
    func deleteProject(id: UUID) throws -> PromptProjectSnapshot?
}
