import Foundation
import SwiftData

@Model
final class ImagePromptDetail {
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
    @Attribute(.externalStorage) var referenceImageData: Data?
    var referenceImageFilename: String?

    var project: PromptProject?

    init(
        subject: String = "",
        composition: String = "",
        style: String = "",
        lighting: String = "",
        camera: String = "",
        colorTone: String = "",
        mood: String = "",
        environment: String = "",
        negativePrompt: String = "",
        notes: String = "",
        referenceImageData: Data? = nil,
        referenceImageFilename: String? = nil
    ) {
        self.subject = subject
        self.composition = composition
        self.style = style
        self.lighting = lighting
        self.camera = camera
        self.colorTone = colorTone
        self.mood = mood
        self.environment = environment
        self.negativePrompt = negativePrompt
        self.notes = notes
        self.referenceImageData = referenceImageData
        self.referenceImageFilename = referenceImageFilename
    }

    convenience init(snapshot: ImagePromptDetailSnapshot) {
        self.init(
            subject: snapshot.subject,
            composition: snapshot.composition,
            style: snapshot.style,
            lighting: snapshot.lighting,
            camera: snapshot.camera,
            colorTone: snapshot.colorTone,
            mood: snapshot.mood,
            environment: snapshot.environment,
            negativePrompt: snapshot.negativePrompt,
            notes: snapshot.notes,
            referenceImageData: snapshot.referenceImageData,
            referenceImageFilename: snapshot.referenceImageFilename
        )
    }

    func apply(snapshot: ImagePromptDetailSnapshot) {
        subject = snapshot.subject
        composition = snapshot.composition
        style = snapshot.style
        lighting = snapshot.lighting
        camera = snapshot.camera
        colorTone = snapshot.colorTone
        mood = snapshot.mood
        environment = snapshot.environment
        negativePrompt = snapshot.negativePrompt
        notes = snapshot.notes
        referenceImageData = snapshot.referenceImageData
        referenceImageFilename = snapshot.referenceImageFilename
    }

    func makeSnapshot() -> ImagePromptDetailSnapshot {
        ImagePromptDetailSnapshot(
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
        )
    }
}
