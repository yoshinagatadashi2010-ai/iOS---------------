import Foundation
import SwiftData

@Model
final class VideoScene {
    @Attribute(.unique) var id: UUID
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

    var videoDetail: VideoPromptDetail?

    init(
        id: UUID = UUID(),
        orderIndex: Int,
        title: String = "",
        durationSeconds: Int = 5,
        content: String = "",
        cameraWork: String = "",
        subjectMotion: String = "",
        background: String = "",
        mood: String = "",
        soundNote: String = "",
        transitionNote: String = "",
        notes: String = ""
    ) {
        self.id = id
        self.orderIndex = orderIndex
        self.title = title
        self.durationSeconds = max(1, durationSeconds)
        self.content = content
        self.cameraWork = cameraWork
        self.subjectMotion = subjectMotion
        self.background = background
        self.mood = mood
        self.soundNote = soundNote
        self.transitionNote = transitionNote
        self.notes = notes
    }

    convenience init(snapshot: VideoSceneSnapshot) {
        self.init(
            id: snapshot.id,
            orderIndex: snapshot.orderIndex,
            title: snapshot.title,
            durationSeconds: snapshot.durationSeconds,
            content: snapshot.content,
            cameraWork: snapshot.cameraWork,
            subjectMotion: snapshot.subjectMotion,
            background: snapshot.background,
            mood: snapshot.mood,
            soundNote: snapshot.soundNote,
            transitionNote: snapshot.transitionNote,
            notes: snapshot.notes
        )
    }

    func apply(snapshot: VideoSceneSnapshot) {
        orderIndex = snapshot.orderIndex
        title = snapshot.title
        durationSeconds = max(1, snapshot.durationSeconds)
        content = snapshot.content
        cameraWork = snapshot.cameraWork
        subjectMotion = snapshot.subjectMotion
        background = snapshot.background
        mood = snapshot.mood
        soundNote = snapshot.soundNote
        transitionNote = snapshot.transitionNote
        notes = snapshot.notes
    }

    func makeSnapshot() -> VideoSceneSnapshot {
        VideoSceneSnapshot(
            id: id,
            orderIndex: orderIndex,
            title: title,
            durationSeconds: durationSeconds,
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
