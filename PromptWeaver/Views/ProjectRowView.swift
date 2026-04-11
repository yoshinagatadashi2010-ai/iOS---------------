import SwiftUI

struct ProjectRowView: View {
    let project: PromptProjectSnapshot
    let onFavoriteToggle: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(project.displayTitle)
                        .font(.headline)
                        .foregroundStyle(.primary)
                        .lineLimit(2)

                    HStack(spacing: 8) {
                        Text(project.projectType.displayName)
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        if project.imageDetail?.referenceImageData != nil {
                            Label("参照画像", systemImage: "photo")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                Spacer(minLength: 12)

                Button(action: onFavoriteToggle) {
                    Image(systemName: project.favorite ? "star.fill" : "star")
                        .foregroundStyle(project.favorite ? .yellow : .secondary)
                }
                .buttonStyle(.plain)
            }

            if let summary = project.summary.trimmedOrNil {
                Text(summary)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            if !project.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(project.tags, id: \.self) { tag in
                            Text("#\(tag)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color(uiColor: .secondarySystemBackground))
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }
            }

            Text("更新: \(DateFormatter.promptWeaverTimestamp.string(from: project.updatedAt))")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 6)
    }
}
