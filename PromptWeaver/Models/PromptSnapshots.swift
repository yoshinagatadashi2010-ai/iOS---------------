import Foundation

struct PromptProjectSnapshot: Identifiable, Codable, Equatable, Sendable {
    var id: UUID
    var projectType: PromptProjectType
    var title: String
    var summary: String
    var tags: [String]
    var createdAt: Date
    var updatedAt: Date
    var favorite: Bool
    var archived: Bool
    var language: PromptLanguage
    var outputFormat: PromptOutputFormat
    var imageDetail: ImagePromptDetailSnapshot?
    var videoDetail: VideoPromptDetailSnapshot?

    var displayTitle: String {
        title.trimmedOrNil ?? projectType.fallbackTitle
    }

    var reflectionBaseFilename: String {
        let slug = displayTitle.slugifiedFilenameComponent(fallback: "project")
        return "\(slug)-\(id.uuidString.lowercased())"
    }

    static func empty(
        type: PromptProjectType,
        language: PromptLanguage,
        outputFormat: PromptOutputFormat = .markdown,
        now: Date = .now
    ) -> PromptProjectSnapshot {
        PromptProjectSnapshot(
            id: UUID(),
            projectType: type,
            title: "",
            summary: "",
            tags: [],
            createdAt: now,
            updatedAt: now,
            favorite: false,
            archived: false,
            language: language,
            outputFormat: outputFormat,
            imageDetail: type == .image ? .empty : nil,
            videoDetail: type == .video ? .empty : nil
        )
    }

    mutating func normalizeForPersistence(touchedAt: Date = .now) {
        tags = TagNormalizer.normalize(tags)
        updatedAt = touchedAt

        if var videoDetail {
            videoDetail.normalizeScenes()
            self.videoDetail = videoDetail
        }
    }
}

struct ImagePromptDetailSnapshot: Codable, Equatable, Sendable {
    var subject: String
    var composition: String
    var style: String
    var lighting: String
    var camera: String
    var colorTone: String
    var mood: String
    var environment: String
    var negativePrompt: String
    var notes: String

    static let empty = ImagePromptDetailSnapshot(
        subject: "",
        composition: "",
        style: "",
        lighting: "",
        camera: "",
        colorTone: "",
        mood: "",
        environment: "",
        negativePrompt: "",
        notes: ""
    )
}

struct VideoPromptDetailSnapshot: Codable, Equatable, Sendable {
    var overallConcept: String
    var visualStyle: String
    var pacing: String
    var aspectRatio: String
    var negativePrompt: String
    var notes: String
    var scenes: [VideoSceneSnapshot]

    static let empty = VideoPromptDetailSnapshot(
        overallConcept: "",
        visualStyle: "",
        pacing: "",
        aspectRatio: "",
        negativePrompt: "",
        notes: "",
        scenes: []
    )

    mutating func normalizeScenes() {
        scenes = scenes
            .sorted(by: VideoSceneSnapshot.displayOrderSort)
            .enumerated()
            .map { index, scene in
                var updated = scene
                updated.orderIndex = index
                updated.durationSeconds = max(1, scene.durationSeconds)
                return updated
            }
    }
}

struct VideoSceneSnapshot: Identifiable, Codable, Equatable, Sendable {
    var id: UUID
    var orderIndex: Int
    var title: String
    var durationSeconds: Int
    var content: String
    var cameraWork: String
    var subjectMotion: String
    var background: String
    var mood: String
    var soundNote: String
    var transitionNote: String
    var notes: String

    static let displayOrderSort: (VideoSceneSnapshot, VideoSceneSnapshot) -> Bool = { lhs, rhs in
        if lhs.orderIndex == rhs.orderIndex {
            return lhs.id.uuidString < rhs.id.uuidString
        }
        return lhs.orderIndex < rhs.orderIndex
    }

    static func empty(orderIndex: Int) -> VideoSceneSnapshot {
        VideoSceneSnapshot(
            id: UUID(),
            orderIndex: orderIndex,
            title: "",
            durationSeconds: 5,
            content: "",
            cameraWork: "",
            subjectMotion: "",
            background: "",
            mood: "",
            soundNote: "",
            transitionNote: "",
            notes: ""
        )
    }
}
