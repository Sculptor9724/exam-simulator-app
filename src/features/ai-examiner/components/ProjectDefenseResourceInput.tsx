import { useMemo, useRef, useState } from "react";

interface ProjectDefenseResourceInputProps {
  useDocumentResource: boolean;
  onUseDocumentResourceChange: (checked: boolean) => void;
  useGithubResource: boolean;
  onUseGithubResourceChange: (checked: boolean) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  repoUrl: string;
  onRepoUrlChange: (url: string) => void;
  fileErrors: Record<string, string>;
  onFileErrorsChange: (errors: Record<string, string>) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_MB = 4.5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_EXTENSION = ".pdf";

function validateFile(file: File): string | null {
  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  if (extension !== ACCEPTED_EXTENSION) {
    return "Kun PDF-filer er understøttet. Eksporter dit dokument til PDF og prøv igen.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Filen er for stor. Maksimum er ${MAX_FILE_SIZE_MB} MB. Prøv at komprimere din PDF og upload den igen.`;
  }

  return null;
}

function getFileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function isLikelyGithubRepoUrl(value: string): boolean {
  if (!value.trim()) {
    return true;
  }

  try {
    const parsed = new URL(value.trim());
    if (
      parsed.hostname !== "github.com" &&
      parsed.hostname !== "www.github.com"
    ) {
      return false;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts.length >= 2;
  } catch {
    return false;
  }
}

export default function ProjectDefenseResourceInput({
  useDocumentResource,
  onUseDocumentResourceChange,
  useGithubResource,
  onUseGithubResourceChange,
  files,
  onFilesChange,
  repoUrl,
  onRepoUrlChange,
  fileErrors,
  onFileErrorsChange,
  disabled = false,
}: ProjectDefenseResourceInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showResourceInputs, setShowResourceInputs] = useState(
    files.length > 0 || repoUrl.trim().length > 0,
  );

  const invalidErrors = useMemo(
    () =>
      Object.entries(fileErrors).filter(([fileName]) => {
        return !files.some((file) => file.name === fileName);
      }),
    [fileErrors, files],
  );

  const hasInvalidGithubUrl = !isLikelyGithubRepoUrl(repoUrl);
  const hasSelectedResourceType = useDocumentResource || useGithubResource;

  function handleNewFiles(selectedFiles: FileList | null): void {
    if (!selectedFiles || disabled) {
      return;
    }

    const selected = Array.from(selectedFiles);
    const nextErrors = { ...fileErrors };
    const existingFileKeys = new Set(files.map((file) => getFileKey(file)));
    const validFiles: File[] = [];

    selected.forEach((file) => {
      const validationError = validateFile(file);

      if (validationError) {
        nextErrors[file.name] = validationError;
        return;
      }

      delete nextErrors[file.name];

      const fileKey = getFileKey(file);
      if (!existingFileKeys.has(fileKey)) {
        validFiles.push(file);
        existingFileKeys.add(fileKey);
      }
    });

    const nextFiles = [...files, ...validFiles];
    onFileErrorsChange(nextErrors);
    onFilesChange(nextFiles);
  }

  function removeFile(fileName: string): void {
    onFilesChange(files.filter((file) => file.name !== fileName));

    if (fileErrors[fileName]) {
      const nextErrors = { ...fileErrors };
      delete nextErrors[fileName];
      onFileErrorsChange(nextErrors);
    }
  }

  return (
    <div className="space-y-4">
      {!showResourceInputs ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">
            Hvilke ressourcer vil du forsvare?
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={useDocumentResource}
                onChange={(event) =>
                  onUseDocumentResourceChange(event.target.checked)
                }
                disabled={disabled}
              />
              Rapport / præsentation (PDF)
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={useGithubResource}
                onChange={(event) =>
                  onUseGithubResourceChange(event.target.checked)
                }
                disabled={disabled}
              />
              GitHub repository
            </label>
          </div>

          <button
            type="button"
            disabled={disabled || !hasSelectedResourceType}
            className="mt-4 inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShowResourceInputs(true)}
          >
            Tilføj ressourcer
          </button>
        </div>
      ) : (
        <div className="flex justify-start">
          <button
            type="button"
            disabled={disabled}
            className="inline-flex items-center gap-1 text-sm text-blue-700 font-medium hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShowResourceInputs(false)}
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            Tilbage til valg af ressourcetype
          </button>
        </div>
      )}

      {showResourceInputs && useDocumentResource && (
        <div
          className={`rounded-xl border-2 mb-12 border-dashed p-4 space-y-3 transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50"
          } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) {
              setIsDragActive(true);
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!disabled) {
              setIsDragActive(true);
            }
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setIsDragActive(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            handleNewFiles(event.dataTransfer.files);
          }}
          onClick={() => {
            if (!disabled) {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            className="hidden"
            disabled={disabled}
            onChange={(event) => {
              handleNewFiles(event.target.files);
              event.target.value = "";
            }}
          />

          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-blue-600 text-2xl">
                  note_add
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-gray-900 leading-tight">
                  Rapport / præsentation
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  PDF · Maks. {MAX_FILE_SIZE_MB} MB pr. fil
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={disabled}
              className="inline-flex items-center rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-blue-700 font-semibold whitespace-nowrap cursor-pointer disabled:cursor-not-allowed text-base"
              onClick={(event) => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Vælg filer
            </button>
          </div>

          <p
            className={`mt-6 text-sm ${
              files.length > 0 ? "text-green-700" : "text-gray-600"
            }`}
          >
            {files.length > 0
              ? `${files.length} fil${files.length > 1 ? "er" : ""} klar til eksamen`
              : "Ingen filer valgt endnu"}
          </p>

          {(files.length > 0 || invalidErrors.length > 0) && (
            <div className="mt-2 space-y-2">
              {files.map((file) => {
                const extension =
                  file.name.split(".").pop()?.toLowerCase() || "pdf";

                return (
                  <div
                    key={getFileKey(file)}
                    className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-md"
                  >
                    <span className="material-symbols-outlined text-gray-500 text-base">
                      description
                    </span>
                    <span className="text-sm text-gray-700 truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                    {fileErrors[file.name] ? (
                      <span className="text-xs text-red-500">
                        {fileErrors[file.name]}
                      </span>
                    ) : (
                      <span className="text-xs text-green-600">Klar</span>
                    )}
                    <span className="sr-only">{extension}</span>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        removeFile(file.name);
                      }}
                      className="ml-auto text-gray-400 hover:text-gray-600 cursor-pointer disabled:cursor-not-allowed"
                      disabled={disabled}
                      type="button"
                      aria-label={`Fjern ${file.name}`}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}

              {invalidErrors.map(([fileName, errorMessage]) => (
                <div key={fileName} className="text-xs text-red-500">
                  {fileName}: {errorMessage}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showResourceInputs && useGithubResource && (
        <div
          className={`rounded-2xl border border-gray-300 bg-gray-50 p-6 ${
            useDocumentResource ? "mt-4" : ""
          }`}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-14 w-14 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-green-700 text-2xl">
                code
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-gray-900 leading-tight">
                GitHub Repo
              </p>
            </div>
          </div>

          <input
            type="url"
            placeholder="https://github.com/username/repo"
            value={repoUrl}
            onChange={(event) => onRepoUrlChange(event.target.value)}
            className={`w-full mt-4 border rounded-md px-3 py-2 text-sm bg-white text-gray-800 placeholder:text-gray-500 ${
              hasInvalidGithubUrl ? "border-red-400" : "border-gray-300"
            }`}
            disabled={disabled}
          />

          {repoUrl.trim().length > 0 && (
            <p
              className={`mt-2 text-xs ${
                hasInvalidGithubUrl ? "text-red-600" : "text-green-700"
              }`}
            >
              {hasInvalidGithubUrl
                ? "Linket ligner ikke et gyldigt GitHub repo. Brug formatet github.com/bruger/repo"
                : "GitHub-link ser gyldigt ud"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
