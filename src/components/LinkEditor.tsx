import { useState } from "react";
import { safeUrl } from "../model";
import type { JitsukaLink } from "../domain/schema";

// Keep unfinished URLs out of the validated document; complete URLs save live.
export function LinkEditor({
  links,
  onChange,
}: {
  links: JitsukaLink[];
  onChange: (links: JitsukaLink[]) => void;
}) {
  const [drafts, setDrafts] = useState<JitsukaLink[]>(
    links.length ? links : [{ type: "video", url: "" }],
  );
  function change(next: JitsukaLink[]) {
    setDrafts(next);
    if (next.every((link) => !link.url || safeUrl(link.url)))
      onChange(next.filter((link) => link.url));
  }
  return (
    <div className="link-editor">
      {drafts.map((link, index) => (
        <div key={index}>
          <label>
            {index === 0
              ? "Video or reference link"
              : `Reference link ${index + 1}`}
            <input
              type="url"
              placeholder="add video link"
              value={link.url}
              aria-invalid={!!link.url && !safeUrl(link.url)}
              onChange={(event) =>
                change(
                  drafts.map((item, i) =>
                    i === index ? { ...item, url: event.target.value } : item,
                  ),
                )
              }
            />
          </label>
          {link.url && !safeUrl(link.url) && (
            <p className="error">
              Use a complete http or https URL. Unfinished links have not been
              saved.
            </p>
          )}
          {link.url && (
            <details>
              <summary>Link details</summary>
              <label>
                Link type
                <select
                  value={link.type}
                  onChange={(event) =>
                    change(
                      drafts.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              type: event.target.value as JitsukaLink["type"],
                            }
                          : item,
                      ),
                    )
                  }
                >
                  <option value="video">Video</option>
                  <option value="article">Article</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Link label
                <input
                  value={link.label ?? ""}
                  onChange={(event) =>
                    change(
                      drafts.map((item, i) =>
                        i === index
                          ? { ...item, label: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </label>
              <button
                onClick={() =>
                  change(
                    drafts.length === 1
                      ? [{ type: "video", url: "" }]
                      : drafts.filter((_, i) => i !== index),
                  )
                }
              >
                Remove link
              </button>
            </details>
          )}
        </div>
      ))}
      <button
        onClick={() => setDrafts([...drafts, { type: "video", url: "" }])}
      >
        Add link
      </button>
    </div>
  );
}
