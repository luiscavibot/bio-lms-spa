import { httpClient } from "@/lib/httpClient";

const API = "/api/v1";

export type SpaceState = "STAGED" | "PUBLISHED" | "ARCHIVED";
export type PostState = "STAGED" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type AttachmentKind = "DRIVE_FILE" | "LINK" | "YOUTUBE" | "FORM";
export type TransferState = "PENDING" | "TRANSFERRED" | "LINK_ONLY" | "UNAVAILABLE";

export interface ContentSpaceSummary {
  id: number;
  title: string;
  section?: string;
  sourceProvider: string;
  sourceState: string;
  localState: SpaceState;
  courseOfferingId?: number;
  blockId?: number;
  teacherCount: number;
  studentCount: number;
  sourceCreatedAt?: string;
  capturedAt: string;
  postCount: number;
  attachmentCount: number;
  flaggedCount: number;
}

export interface ContentAttachment {
  id: number;
  kind: AttachmentKind;
  title: string;
  url?: string;
  mimeType?: string;
  sizeBytes?: number;
  transferState: TransferState;
  disposition: string;
}

export interface ContentPost {
  id: number;
  title: string;
  body?: string;
  sourceState: string;
  localState: PostState;
  reviewFlag?: string;
  audienceMode?: string;
  authorName?: string;
  sourceCreatedAt?: string;
  attachments: ContentAttachment[];
}

export interface ContentSection {
  id: number;
  kind: "TOPIC" | "GENERAL";
  title: string;
  weekNumberHint?: number;
  weekId?: number;
  posts: ContentPost[];
}

export interface ContentSpaceDetail
  extends Omit<ContentSpaceSummary, "postCount" | "attachmentCount" | "flaggedCount"> {
  sections: ContentSection[];
  unsectionedPosts: ContentPost[];
}

export const contentSpacesService = {
  list() {
    return httpClient.get<{ spaces: ContentSpaceSummary[] }>(`${API}/content-spaces`);
  },
  get(id: number) {
    return httpClient.get<ContentSpaceDetail>(`${API}/content-spaces/${id}`);
  },
};
