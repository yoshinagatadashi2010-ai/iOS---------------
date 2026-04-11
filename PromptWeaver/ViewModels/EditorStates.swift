import Foundation

struct ProjectMetadataEditorState: Equatable {
    var title: String = ""
    var summary: String = ""
    var tagsText: String = ""
    var favorite: Bool = false
    var archived: Bool = false
    var language: PromptLanguage = .japanese
    var outputFormat: PromptOutputFormat = .markdown

    init() {}

    init(snapshot: PromptProjectSnapshot) {
        title = snapshot.title
        summary = snapshot.summary
        tagsText = snapshot.tags.joined(separator: ", ")
        favorite = snapshot.favorite
        archived = snapshot.archived
        language = snapshot.language
        outputFormat = snapshot.outputFormat
    }

    var tags: [String] {
        TagNormalizer.parse(text: tagsText)
    }
}

struct ImagePromptEditorState: Equatable {
    var metadata: ProjectMetadataEditorState
    var subject: String = ""
    var composition: String = ""
    var style: String = ""
    var lighting: String = ""
    var camera: String = ""
    var colorTone: String = ""
    var mood: String = ""
    var environment: String = ""
    var negativePrompt: String = ""
    var notes: String = ""
    var referenceImageData: Data? = nil
    var referenceImageFilename: String? = nil

    init(defaultLanguage: PromptLanguage) {
        metadata = ProjectMetadataEditorState()
        metadata.language = defaultLanguage
    }

    init(snapshot: PromptProjectSnapshot) {
        metadata = ProjectMetadataEditorState(snapshot: snapshot)
        let detail = snapshot.imageDetail ?? .empty
        subject = detail.subject
        composition = detail.composition
        style = detail.style
        lighting = detail.lighting
        camera = detail.camera
        colorTone = detail.colorTone
        mood = detail.mood
        environment = detail.environment
        negativePrompt = detail.negativePrompt
        notes = detail.notes
        referenceImageData = detail.referenceImageData
        referenceImageFilename = detail.referenceImageFilename
    }

    func makeSnapshot(id: UUID, createdAt: Date) -> PromptProjectSnapshot {
        PromptProjectSnapshot(
            id: id,
            projectType: .image,
            title: metadata.title,
            summary: metadata.summary,
            tags: metadata.tags,
            createdAt: createdAt,
            updatedAt: .now,
            favorite: metadata.favorite,
            archived: metadata.archived,
            language: metadata.language,
            outputFormat: metadata.outputFormat,
            imageDetail: ImagePromptDetailSnapshot(
                subject: subject,
                composition: composition,
                style: style,
                lighting: lighting,
                camera: camera,
                colorTone: colorTone,
                mood: mood,
                environment: environment,
                negativePrompt: negativePrompt,
                notes: notes,
                referenceImageData: referenceImageData,
                referenceImageFilename: referenceImageFilename
            ),
            videoDetail: nil
        )
    }
}

struct VideoSceneEditorState: Identifiable, Equatable {
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

    init(snapshot: VideoSceneSnapshot) {
        id = snapshot.id
        orderIndex = snapshot.orderIndex
        title = snapshot.title
        durationSeconds = snapshot.durationSeconds
        content = snapshot.content
        cameraWork = snapshot.cameraWork
        subjectMotion = snapshot.subjectMotion
        background = snapshot.background
        mood = snapshot.mood
        soundNote = snapshot.soundNote
        transitionNote = snapshot.transitionNote
        notes = snapshot.notes
    }

    init(orderIndex: Int) {
        let snapshot = VideoSceneSnapshot.empty(orderIndex: orderIndex)
        self.init(snapshot: snapshot)
    }

    func makeSnapshot(orderIndex: Int) -> VideoSceneSnapshot {
        VideoSceneSnapshot(
            id: id,
            orderIndex: orderIndex,
            title: title,
            durationSeconds: max(1, durationSeconds),
            content: content,
            cameraWork: cameraWork,
            subjectMotion: subjectMotion,
            background: background,
            mood: mood,
            soundNote: soundNote,
            transitionNote: transitionNote,
            notes: notes
        )
    }
}

struct VideoPromptEditorState: Equatable {
    var metadata: ProjectMetadataEditorState
    var overallConcept: String = ""
    var visualStyle: String = ""
    var pacing: String = ""
    var aspectRatio: String = ""
    var negativePrompt: String = ""
    var notes: String = ""
    var scenes: [VideoSceneEditorState] = []

    init(defaultLanguage: PromptLanguage) {
        metadata = ProjectMetadataEditorState()
        metadata.language = defaultLanguage
    }

    init(snapshot: PromptProjectSnapshot) {
        metadata = ProjectMetadataEditorState(snapshot: snapshot)
        let detail = snapshot.videoDetail ?? .empty
        overallConcept = detail.overallConcept
        visualStyle = detail.visualStyle
        pacing = detail.pacing
        aspectRatio = detail.aspectRatio
        negativePrompt = detail.negativePrompt
        notes = detail.notes
        scenes = detail.scenes.sorted(by: VideoSceneSnapshot.displayOrderSort).map(VideoSceneEditorState.init(snapshot:))
    }

    var totalDurationSeconds: Int {
        scenes.reduce(0) { $0 + max(1, $1.durationSeconds) }
    }

    func makeSnapshot(id: UUID, createdAt: Date) -> PromptProjectSnapshot {
        PromptProjectSnapshot(
            id: id,
            projectType: .video,
            title: metadata.title,
            summary: metadata.summary,
            tags: metadata.tags,
            createdAt: createdAt,
            updatedAt: .now,
            favorite: metadata.favorite,
            archived: metadata.archived,
            language: metadata.language,
            outputFormat: metadata.outputFormat,
            imageDetail: nil,
            videoDetail: VideoPromptDetailSnapshot(
                overallConcept: overallConcept,
                visualStyle: visualStyle,
                pacing: pacing,
                aspectRatio: aspectRatio,
                negativePrompt: negativePrompt,
                notes: notes,
                scenes: scenes.enumerated().map { index, scene in
                    scene.makeSnapshot(orderIndex: index)
                }
            )
        )
    }
}
