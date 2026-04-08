import Foundation
import SwiftData

@MainActor
final class SwiftDataPromptProjectRepository: PromptProjectRepository {
    private let modelContext: ModelContext

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func fetchProjects(searchText: String, filter: ProjectListFilter, sort: ProjectSortOption) throws -> [PromptProjectSnapshot] {
        let projects = try fetchAllProjects()

        let filtered = projects.filter { project in
            matchesFilter(project, filter: filter) && matchesSearch(project, searchText: searchText)
        }

        return sortProjects(filtered, by: sort).map(\.makeSnapshot)
    }

    func fetchProject(id: UUID) throws -> PromptProjectSnapshot? {
        try fetchProjectModel(id: id)?.makeSnapshot()
    }

    func fetchRecentProjects(limit: Int) throws -> [PromptProjectSnapshot] {
        Array(try fetchAllProjects().sorted { $0.updatedAt > $1.updatedAt }.prefix(limit).map(\.makeSnapshot))
    }

    func fetchFavoriteProjects(limit: Int? = nil) throws -> [PromptProjectSnapshot] {
        let favorites = try fetchAllProjects()
            .filter(\.favorite)
            .sorted { lhs, rhs in lhs.updatedAt > rhs.updatedAt }
            .map(\.makeSnapshot)

        if let limit {
            return Array(favorites.prefix(limit))
        }

        return favorites
    }

    func saveProject(snapshot: PromptProjectSnapshot) throws -> PromptProjectSnapshot {
        var normalizedSnapshot = snapshot
        normalizedSnapshot.normalizeForPersistence()

        let model = try fetchProjectModel(id: normalizedSnapshot.id) ?? PromptProject(snapshot: normalizedSnapshot)

        if model.modelContext == nil {
            modelContext.insert(model)
        }

        model.apply(snapshot: normalizedSnapshot)
        try modelContext.save()
        return model.makeSnapshot()
    }

    func updateFavorite(id: UUID, isFavorite: Bool) throws -> PromptProjectSnapshot? {
        guard let project = try fetchProjectModel(id: id) else {
            return nil
        }

        project.favorite = isFavorite
        project.updatedAt = .now
        try modelContext.save()
        return project.makeSnapshot()
    }

    func duplicateProject(id: UUID) throws -> PromptProjectSnapshot? {
        guard var snapshot = try fetchProject(id: id) else {
            return nil
        }

        let now = Date.now
        snapshot.id = UUID()
        snapshot.createdAt = now
        snapshot.updatedAt = now
        snapshot.favorite = false
        snapshot.title = duplicateTitle(from: snapshot.displayTitle)

        if var videoDetail = snapshot.videoDetail {
            videoDetail.scenes = videoDetail.scenes.enumerated().map { index, scene in
                var copiedScene = scene
                copiedScene.id = UUID()
                copiedScene.orderIndex = index
                return copiedScene
            }
            snapshot.videoDetail = videoDetail
        }

        return try saveProject(snapshot: snapshot)
    }

    func deleteProject(id: UUID) throws -> PromptProjectSnapshot? {
        guard let project = try fetchProjectModel(id: id) else {
            return nil
        }

        let snapshot = project.makeSnapshot()
        modelContext.delete(project)
        try modelContext.save()
        return snapshot
    }

    private func fetchAllProjects() throws -> [PromptProject] {
        let descriptor = FetchDescriptor<PromptProject>(
            sortBy: [SortDescriptor(\.updatedAt, order: .reverse)]
        )
        return try modelContext.fetch(descriptor)
    }

    private func fetchProjectModel(id: UUID) throws -> PromptProject? {
        let descriptor = FetchDescriptor<PromptProject>(
            predicate: #Predicate<PromptProject> { project in
                project.id == id
            }
        )
        return try modelContext.fetch(descriptor).first
    }

    private func matchesFilter(_ project: PromptProject, filter: ProjectListFilter) -> Bool {
        switch filter {
        case .all:
            return true
        case .image:
            return project.projectType == .image
        case .video:
            return project.projectType == .video
        }
    }

    private func matchesSearch(_ project: PromptProject, searchText: String) -> Bool {
        let term = searchText.trimmed.lowercased()
        guard !term.isEmpty else {
            return true
        }

        let tags = project.tags.joined(separator: " ").lowercased()
        return project.title.lowercased().contains(term) || tags.contains(term)
    }

    private func sortProjects(_ projects: [PromptProject], by sort: ProjectSortOption) -> [PromptProject] {
        switch sort {
        case .updatedDescending:
            return projects.sorted { $0.updatedAt > $1.updatedAt }
        case .titleAscending:
            return projects.sorted {
                $0.makeSnapshot().displayTitle.localizedCaseInsensitiveCompare($1.makeSnapshot().displayTitle) == .orderedAscending
            }
        case .favoriteFirst:
            return projects.sorted { lhs, rhs in
                if lhs.favorite != rhs.favorite {
                    return lhs.favorite && !rhs.favorite
                }
                return lhs.updatedAt > rhs.updatedAt
            }
        }
    }

    private func duplicateTitle(from title: String) -> String {
        if title.hasSuffix("のコピー") {
            return title
        }
        return "\(title) のコピー"
    }
}
