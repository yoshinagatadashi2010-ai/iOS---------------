import Foundation
import SwiftData

@Model
final class PromptProject {
    @Attribute(.unique) var id: UUID
    var projectTypeRaw: String
    var title: String
    var summary: String
    var tagsRaw: String
    var createdAt: Date
    var updatedAt: Date
    var favorite: Bool
    var archived: Bool
    var languageRaw: String
    var outputFormatRaw: String

    @Relationship(deleteRule: .cascade, inverse: \ImagePromptDetail.project)
    var imageDetail: ImagePromptDetail?

    @Relationship(deleteRule: .cascade, inverse: \VideoPromptDetail.project)
    var videoDetail: VideoPromptDetail?

    init(
        id: UUID = UUID(),
        projectType: PromptProjectType,
        title: String = "",
        summary: String = "",
        tags: [String] = [],
        createdAt: Date = .now,
        updatedAt: Date = .now,
        favorite: Bool = false,
        archived: Bool = false,
        language: PromptLanguage = .japanese,
        outputFormat: PromptOutputFormat = .markdown,
        imageDetail: ImagePromptDetail? = nil,
        videoDetail: VideoPromptDetail? = nil
    ) {
        self.id = id
        projectTypeRaw = projectType.rawValue
        self.title = title
        self.summary = summary
        tagsRaw = TagNormalizer.serialize(tags)
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.favorite = favorite
        self.archived = archived
        languageRaw = language.rawValue
        outputFormatRaw = outputFormat.rawValue
        self.imageDetail = imageDetail
        self.videoDetail = videoDetail
    }

    convenience init(snapshot: PromptProjectSnapshot) {
        self.init(
            id: snapshot.id,
            projectType: snapshot.projectType,
            title: snapshot.title,
            summary: snapshot.summary,
            tags: snapshot.tags,
            createdAt: snapshot.createdAt,
            updatedAt: snapshot.updatedAt,
            favorite: snapshot.favorite,
            archived: snapshot.archived,
            language: snapshot.language,
            outputFormat: snapshot.outputFormat,
            imageDetail: snapshot.imageDetail.map(ImagePromptDetail.init(snapshot:)),
            videoDetail: snapshot.videoDetail.map(VideoPromptDetail.init(snapshot:))
        )

        imageDetail?.project = self
        videoDetail?.project = self
        videoDetail?.scenes.forEach { $0.videoDetail = videoDetail }
    }

    var projectType: PromptProjectType {
        get { PromptProjectType(rawValue: projectTypeRaw) ?? .image }
        set { projectTypeRaw = newValue.rawValue }
    }

    var language: PromptLanguage {
        get { PromptLanguage(rawValue: languageRaw) ?? .japanese }
        set { languageRaw = newValue.rawValue }
    }

    var outputFormat: PromptOutputFormat {
        get { PromptOutputFormat(rawValue: outputFormatRaw) ?? .markdown }
        set { outputFormatRaw = newValue.rawValue }
    }

    var tags: [String] {
        get { TagNormalizer.deserialize(tagsRaw) }
        set { tagsRaw = TagNormalizer.serialize(newValue) }
    }

    func apply(snapshot: PromptProjectSnapshot) {
        projectType = snapshot.projectType
        title = snapshot.title
        summary = snapshot.summary
        tags = snapshot.tags
        createdAt = snapshot.createdAt
        updatedAt = snapshot.updatedAt
        favorite = snapshot.favorite
        archived = snapshot.archived
        language = snapshot.language
        outputFormat = snapshot.outputFormat

        if let imageSnapshot = snapshot.imageDetail {
            if let imageDetail {
                imageDetail.apply(snapshot: imageSnapshot)
            } else {
                let detail = ImagePromptDetail(snapshot: imageSnapshot)
                detail.project = self
                imageDetail = detail
            }
        }

        if let videoSnapshot = snapshot.videoDetail {
            if let videoDetail {
                videoDetail.apply(snapshot: videoSnapshot)
            } else {
                let detail = VideoPromptDetail(snapshot: videoSnapshot)
                detail.project = self
                detail.scenes.forEach { $0.videoDetail = detail }
                videoDetail = detail
            }
        }
    }

    func makeSnapshot() -> PromptProjectSnapshot {
        PromptProjectSnapshot(
            id: id,
            projectType: projectType,
            title: title,
            summary: summary,
            tags: tags,
            createdAt: createdAt,
            updatedAt: updatedAt,
            favorite: favorite,
            archived: archived,
            language: language,
            outputFormat: outputFormat,
            imageDetail: imageDetail?.makeSnapshot(),
            videoDetail: videoDetail?.makeSnapshot()
        )
    }
}
