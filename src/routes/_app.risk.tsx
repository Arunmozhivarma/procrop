import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { Icon } from "@/components/Icon";
import { toast } from "sonner";
import {
  fetchUserFields,
  createUserField,
  submitMultiLeafCheck,
  compressImageToJpeg,
  FieldRecord,
  DetailedPredictionResponse,
} from "@/services/api";

export const Route = createFileRoute("/_app/risk")({
  head: () => ({
    meta: [
      { title: "New Field Check & Jassid Risk Assessment — ProCrop" },
      {
        name: "description",
        content:
          "Guided 3-step field risk assessment: Agronomy & Spray History -> Guided 15-Leaf Photo Upload -> Real-Time Risk & IPM Recommendations.",
      },
      { property: "og:title", content: "New Field Check — ProCrop" },
    ],
  }),
  component: RiskAssessmentWizard,
});

const TARGET_SLOTS = [
  { id: 1, label: "Plant 1 — Top Leaf (Underside)" },
  { id: 2, label: "Plant 1 — Middle Leaf (Underside)" },
  { id: 3, label: "Plant 1 — Bottom Leaf (Underside)" },
  { id: 4, label: "Plant 2 — Top Leaf (Underside)" },
  { id: 5, label: "Plant 2 — Middle Leaf (Underside)" },
  { id: 6, label: "Plant 2 — Bottom Leaf (Underside)" },
  { id: 7, label: "Plant 3 — Top Leaf (Underside)" },
  { id: 8, label: "Plant 3 — Middle Leaf (Underside)" },
  { id: 9, label: "Plant 3 — Bottom Leaf (Underside)" },
  { id: 10, label: "Plant 4 — Top Leaf (Underside)" },
  { id: 11, label: "Plant 4 — Middle Leaf (Underside)" },
  { id: 12, label: "Plant 4 — Bottom Leaf (Underside)" },
  { id: 13, label: "Plant 5 — Top Leaf (Underside)" },
  { id: 14, label: "Plant 5 — Middle Leaf (Underside)" },
  { id: 15, label: "Plant 5 — Bottom Leaf (Underside)" },
];

interface UploadedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  slotIndex: number;
}

const STORAGE_KEY_DRAFT = "procrop_wizard_draft";

export function RiskAssessmentWizard() {
  const navigate = useNavigate();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Field & Crop Form State
  const [fields, setFields] = useState<FieldRecord[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("new");
  const [fieldName, setFieldName] = useState("North Block 1");
  const [district, setDistrict] = useState("Coimbatore");
  const [lat, setLat] = useState<number>(11.0168);
  const [lon, setLon] = useState<number>(76.9558);
  const [sowingDate, setSowingDate] = useState("2026-08-15");
  const [variety, setVariety] = useState("Bt Cotton Hybrid (RCH 659)");
  const [varietyTrait, setVarietyTrait] = useState("tolerant_hairy");
  const [btStatus, setBtStatus] = useState("Bt");
  const [lastSprayDate, setLastSprayDate] = useState("");
  const [noSprayYet, setNoSprayYet] = useState(false);
  const [sprayProductClass, setSprayProductClass] = useState("none");
  const [sprayProductName, setSprayProductName] = useState("");

  // Optional Agronomy
  const [showOptional, setShowOptional] = useState(false);
  const [nitrogenLevel, setNitrogenLevel] = useState("medium");
  const [irrigation, setIrrigation] = useState("rainfed");
  const [alternateHosts, setAlternateHosts] = useState("none");

  // Step 2: Photos State
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState("");

  // Load fields and draft on mount
  useEffect(() => {
    fetchUserFields().then((res) => {
      setFields(res);
      if (res.length > 0 && selectedFieldId === "new") {
        const first = res[0];
        if (first) {
          setSelectedFieldId(first.id.toString());
          prefillFromField(first);
        }
      }
    });

    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_DRAFT);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.fieldName) setFieldName(draft.fieldName);
        if (draft.district) setDistrict(draft.district);
        if (draft.sowingDate) setSowingDate(draft.sowingDate);
        if (draft.variety) setVariety(draft.variety);
        if (draft.varietyTrait) setVarietyTrait(draft.varietyTrait);
        if (draft.btStatus) setBtStatus(draft.btStatus);
        if (draft.sprayProductClass) setSprayProductClass(draft.sprayProductClass);
      }
    } catch {
      // Ignore sessionStorage parsing errors
    }
  }, []);

  const prefillFromField = (f: FieldRecord) => {
    setFieldName(f.name);
    if (f.district) setDistrict(f.district);
    if (f.lat) setLat(f.lat);
    if (f.lon) setLon(f.lon);
    if (f.sowing_date) setSowingDate(f.sowing_date);
    if (f.variety) setVariety(f.variety);
    if (f.variety_trait) setVarietyTrait(f.variety_trait);
    if (f.bt_status) setBtStatus(f.bt_status);
    if (f.nitrogen_level) setNitrogenLevel(f.nitrogen_level);
    if (f.irrigation) setIrrigation(f.irrigation);
    if (f.alternate_hosts) setAlternateHosts(f.alternate_hosts);
  };

  const handleFieldSelect = (idStr: string) => {
    setSelectedFieldId(idStr);
    if (idStr !== "new") {
      const match = fields.find((f) => f.id.toString() === idStr);
      if (match) prefillFromField(match);
    }
  };

  const saveDraftToStorage = () => {
    try {
      const draft = {
        fieldName,
        district,
        lat,
        lon,
        sowingDate,
        variety,
        varietyTrait,
        btStatus,
        lastSprayDate: noSprayYet ? "no spray yet" : lastSprayDate,
        sprayProductClass,
        sprayProductName,
        nitrogenLevel,
        irrigation,
        alternateHosts,
      };
      sessionStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(draft));
    } catch {
      // Ignore
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(4)));
        setLon(Number(pos.coords.longitude.toFixed(4)));
        toast.success(
          `Location set: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`,
        );
      },
      (err) => {
        toast.error(`Could not retrieve GPS coordinates: ${err.message}`);
      },
    );
  };

  // Image upload & compression handler
  const handleFilesAdded = async (newFileList: FileList | File[]) => {
    setIsCompressing(true);
    const addedPhotos: UploadedPhoto[] = [];

    for (let i = 0; i < newFileList.length; i++) {
      const file = newFileList[i];
      if (!file) continue;
      if (!file.type.startsWith("image/")) {
        toast.error(`Rejected non-image file: ${file.name}`);
        continue;
      }
      try {
        const compressed = await compressImageToJpeg(file, 1600, 0.85);
        const previewUrl = URL.createObjectURL(compressed);
        addedPhotos.push({
          id: `${Date.now()}_${Math.random()}`,
          file: compressed,
          previewUrl,
          name: file.name,
          slotIndex: photos.length + addedPhotos.length,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Compression error";
        toast.error(`Error processing ${file.name}: ${msg}`);
      }
    }

    const updated = [...photos, ...addedPhotos];
    setPhotos(updated);
    setIsCompressing(false);

    // Toast notifications based on exact specification
    const count = updated.length;
    if (count < 5) {
      toast.info(
        `Add at least 5 leaf photos to continue (you have ${count}). For a reliable result take 15: 5 plants x top, middle and bottom leaf.`,
      );
    } else if (count >= 5 && count < 15) {
      toast.warning(
        `${count} of 15 photos added. You can continue, but the result will be marked low confidence. Add ${15 - count} more for a reliable result.`,
      );
    } else if (count >= 15 && count <= 30) {
      toast.success("15 photos added. This is enough for a reliable estimate.");
    } else if (count > 30) {
      toast.error(`Maximum 30 photos. Remove ${count - 30} to continue.`);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const photoToRemove = photos[index];
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.previewUrl);
    }
    const updated = photos.filter((_, idx) => idx !== index);
    setPhotos(updated);
  };

  // Submission
  const handleSubmitPrediction = async () => {
    if (photos.length < 5) {
      toast.error(`Add at least 5 leaf photos to continue (you have ${photos.length}).`);
      return;
    }
    if (photos.length > 30) {
      toast.error(`Maximum 30 photos. Remove ${photos.length - 30} to continue.`);
      return;
    }

    setIsSubmitting(true);
    setSubmissionProgress(`Analysing ${photos.length} photos...`);

    try {
      // 1. If new field entered, create it in DB
      let fieldId: number | undefined = undefined;
      if (selectedFieldId !== "new") {
        fieldId = parseInt(selectedFieldId, 10);
      } else if (fieldName) {
        try {
          const created = await createUserField({
            name: fieldName,
            lat,
            lon,
            district,
            sowing_date: sowingDate,
            variety,
            variety_trait: varietyTrait,
            bt_status: btStatus,
            nitrogen_level: nitrogenLevel,
            irrigation,
            alternate_hosts: alternateHosts,
          });
          fieldId = created.id;
        } catch {
          // Continue even if field save encounters issue
        }
      }

      // 2. Prepare Multipart FormData
      const formData = new FormData();
      photos.forEach((p) => {
        formData.append("images", p.file, p.name);
      });

      const payload = {
        field_id: fieldId,
        field_name: fieldName,
        sowing_date: sowingDate,
        variety,
        variety_trait: varietyTrait,
        bt_status: btStatus,
        last_spray_date: noSprayYet ? "no spray yet" : lastSprayDate,
        spray_product_class: sprayProductClass,
        spray_product_name: sprayProductName,
        nitrogen_level: nitrogenLevel,
        irrigation,
        alternate_hosts: alternateHosts,
        latitude: lat,
        longitude: lon,
      };

      formData.append("payload", JSON.stringify(payload));

      const response: DetailedPredictionResponse = await submitMultiLeafCheck(formData);
      toast.success("Risk prediction generated successfully!");
      // Clear draft
      sessionStorage.removeItem(STORAGE_KEY_DRAFT);
      // Navigate to recommendation page
      navigate({
        to: "/recommendations",
        search: { id: response.prediction_id.toString() },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Prediction request failed.";
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  // Progress Bar styling
  const photoCount = photos.length;
  const progressPct = Math.min(100, Math.round((photoCount / 15) * 100));
  let barColor = "bg-critical";
  if (photoCount >= 15) barColor = "bg-risk-low";
  else if (photoCount >= 5) barColor = "bg-amber-500";

  return (
    <div className="space-y-6 px-4 py-8 md:px-8 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Guided Field Check"
        title="New Jassid Risk Assessment"
        description="Standardized 3-step field scouting wizard: enter crop agronomy, upload 15 leaf undersides (5 plants × 3 canopy levels), and get an explainable risk prediction."
      />

      {/* 3-Step Wizard Navigation Stepper */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 border-b border-border pb-4">
        <button
          type="button"
          onClick={() => {
            saveDraftToStorage();
            setCurrentStep(1);
          }}
          className={`flex items-center gap-2 sm:gap-3 rounded-xl p-3 text-left transition cursor-pointer ${
            currentStep === 1
              ? "bg-primary/10 border-2 border-primary text-primary"
              : "bg-surface border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              currentStep === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}
          >
            1
          </span>
          <div>
            <p className="text-xs sm:text-sm font-semibold">Field & Crop</p>
            <p className="hidden sm:block text-[11px] opacity-70">Agronomy & spray</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            saveDraftToStorage();
            setCurrentStep(2);
          }}
          className={`flex items-center gap-2 sm:gap-3 rounded-xl p-3 text-left transition cursor-pointer ${
            currentStep === 2
              ? "bg-primary/10 border-2 border-primary text-primary"
              : "bg-surface border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              currentStep === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}
          >
            2
          </span>
          <div>
            <p className="text-xs sm:text-sm font-semibold">15 Leaf Photos</p>
            <p className="hidden sm:block text-[11px] opacity-70">5 plants x 3 leaves</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            if (photos.length < 5) {
              toast.warning("Add at least 5 leaf photos to proceed to review.");
              return;
            }
            saveDraftToStorage();
            setCurrentStep(3);
          }}
          className={`flex items-center gap-2 sm:gap-3 rounded-xl p-3 text-left transition cursor-pointer ${
            currentStep === 3
              ? "bg-primary/10 border-2 border-primary text-primary"
              : "bg-surface border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              currentStep === 3 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}
          >
            3
          </span>
          <div>
            <p className="text-xs sm:text-sm font-semibold">Review & Risk</p>
            <p className="hidden sm:block text-[11px] opacity-70">Verify & submit</p>
          </div>
        </button>
      </div>

      {/* ==================== STEP 1: FIELD AND CROP INPUTS ==================== */}
      {currentStep === 1 && (
        <Panel title="Step 1: Field & Crop Characteristics" icon="agriculture">
          <p className="text-sm text-muted-foreground mb-6">
            Enter field details. These inputs calibrate management multipliers and are stored in
            your database history to enable predicted vs. actual tracking.
          </p>

          <div className="space-y-5">
            {/* Field Selection */}
            {fields.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Select Field
                  </label>
                  <select
                    value={selectedFieldId}
                    onChange={(e) => handleFieldSelect(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="new">+ Add New Field</option>
                    {fields.map((f) => (
                      <option key={f.id} value={f.id.toString()}>
                        {f.name} ({f.district || "Coimbatore"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="e.g. South Block 4"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Location & Sowing Date */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Coordinates (Open-Meteo Weather Station)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value))}
                    className="w-1/2 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={lon}
                    onChange={(e) => setLon(parseFloat(e.target.value))}
                    className="w-1/2 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 cursor-pointer"
                  >
                    <Icon name="my_location" className="text-sm" />
                    <span>My GPS</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sowing Date & Variety */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Sowing Date
                </label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Cotton Variety
                </label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="e.g. RCH 659 / Suraj"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Variety Trait (Pubescence)
                </label>
                <select
                  value={varietyTrait}
                  onChange={(e) => setVarietyTrait(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="tolerant_hairy">Hairy / Tolerant (-12% jassid prior)</option>
                  <option value="susceptible">Smooth / Glabrous / Susceptible (+15% prior)</option>
                  <option value="unknown">Unknown / Mixed (Neutral)</option>
                </select>
              </div>
            </div>

            {/* Bt & Spray History */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Bt Status
                </label>
                <select
                  value={btStatus}
                  onChange={(e) => setBtStatus(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="Bt">
                    Bt Cotton (Endotoxin targets bollworms; sucking neutral)
                  </option>
                  <option value="Non-Bt">Non-Bt Conventional Cotton</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Last Spray Date
                </label>
                <input
                  type="date"
                  disabled={noSprayYet}
                  value={lastSprayDate}
                  onChange={(e) => setLastSprayDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
                />
                <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={noSprayYet}
                    onChange={(e) => {
                      setNoSprayYet(e.target.checked);
                      if (e.target.checked) setLastSprayDate("");
                    }}
                  />
                  <span>No spray applied yet this season</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Spray Product Class
                </label>
                <select
                  disabled={noSprayYet}
                  value={sprayProductClass}
                  onChange={(e) => setSprayProductClass(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value="none">None / No recent spray</option>
                  <option value="botanical_neem">
                    Botanical / Neem (Azadirachtin ~5d residual)
                  </option>
                  <option value="neonicotinoid">
                    Neonicotinoid (Imidacloprid/Acetamiprid ~14d)
                  </option>
                  <option value="organophosphate">
                    Organophosphate (Acephate/Dimethoate ~10d)
                  </option>
                  <option value="pyrethroid">Synthetic Pyrethroid (Cypermethrin ~7d)</option>
                  <option value="other">Other Insecticide (~10d)</option>
                </select>
              </div>
            </div>

            {/* Optional Collapsible Agronomy Section */}
            <div className="border-t border-border/80 pt-3">
              <button
                type="button"
                onClick={() => setShowOptional(!showOptional)}
                className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                <Icon name={showOptional ? "expand_less" : "expand_more"} />
                <span>
                  {showOptional ? "Hide" : "Show"} Optional Agronomy Parameters (Nitrogen,
                  Irrigation, Alternate Hosts)
                </span>
              </button>

              {showOptional && (
                <div className="mt-4 grid gap-4 sm:grid-cols-3 rounded-2xl bg-muted/30 p-4 border border-border">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Nitrogen Status
                    </label>
                    <select
                      value={nitrogenLevel}
                      onChange={(e) => setNitrogenLevel(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                    >
                      <option value="low">Low (-5% pest prior)</option>
                      <option value="medium">Balanced / Recommended</option>
                      <option value="high">Excess / Lush growth (+12% prior)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Irrigation Type
                    </label>
                    <select
                      value={irrigation}
                      onChange={(e) => setIrrigation(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                    >
                      <option value="rainfed">Rainfed</option>
                      <option value="drip">Drip Irrigation</option>
                      <option value="flood">Flood / Furrow</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Adjacent Alternate Hosts
                    </label>
                    <select
                      value={alternateHosts}
                      onChange={(e) => setAlternateHosts(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                    >
                      <option value="none">None / No solanaceous border</option>
                      <option value="okra">Okra / Bhendi (+15% prior)</option>
                      <option value="brinjal">Brinjal / Eggplant (+10% prior)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  saveDraftToStorage();
                  setCurrentStep(2);
                }}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                <span>Continue to Leaf Photos →</span>
              </button>
            </div>
          </div>
        </Panel>
      )}

      {/* ==================== STEP 2: GUIDED 15-PHOTO CAPTURE ==================== */}
      {currentStep === 2 && (
        <Panel title="Step 2: Guided 15-Photo Leaf Capture" icon="photo_camera">
          <p className="text-sm text-muted-foreground mb-4">
            Sampling protocol: <strong>5 plants × 3 leaves (top, middle, bottom)</strong>, underside
            orientation.
          </p>

          {/* Progress Counter & Coloured Progress Bar */}
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">
                Progress: <span className="font-bold text-primary">{photoCount} / 15</span> photos
                added
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  photoCount >= 15
                    ? "bg-emerald-500/10 text-emerald-700"
                    : photoCount >= 5
                      ? "bg-amber-500/10 text-amber-700"
                      : "bg-critical/10 text-critical"
                }`}
              >
                {photoCount >= 15
                  ? "Target Reached (High Confidence)"
                  : photoCount >= 5
                    ? "Minimum Met (Low Confidence)"
                    : "Below Minimum (5 required)"}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all duration-300 ${barColor}`}
                style={{ width: `${Math.min(100, Math.max(5, (photoCount / 15) * 100))}%` }}
              />
            </div>
          </div>

          {/* Persistent Inline Notification Banner with EXACT Required Copy */}
          <div className="mt-4">
            {photoCount < 5 && (
              <div className="flex items-start gap-3 rounded-2xl border border-critical/30 bg-critical/10 p-4 text-xs sm:text-sm text-critical">
                <Icon name="warning" className="text-base shrink-0 mt-0.5" />
                <p>
                  Add at least 5 leaf photos to continue (you have {photoCount}). For a reliable
                  result take 15: 5 plants x top, middle and bottom leaf.
                </p>
              </div>
            )}
            {photoCount >= 5 && photoCount < 15 && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-800">
                <Icon name="info" className="text-base shrink-0 mt-0.5" />
                <p>
                  {photoCount} of 15 photos added. You can continue, but the result will be marked
                  low confidence. Add {15 - photoCount} more for a reliable result.
                </p>
              </div>
            )}
            {photoCount >= 15 && photoCount <= 30 && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs sm:text-sm text-emerald-800">
                <Icon name="check_circle" className="text-base shrink-0 mt-0.5" />
                <p>15 photos added. This is enough for a reliable estimate.</p>
              </div>
            )}
            {photoCount > 30 && (
              <div className="flex items-start gap-3 rounded-2xl border border-critical/40 bg-critical/15 p-4 text-xs sm:text-sm text-critical">
                <Icon name="error" className="text-base shrink-0 mt-0.5" />
                <p>Maximum 30 photos. Remove {photoCount - 30} to continue.</p>
              </div>
            )}
          </div>

          {/* Collapsible Example Images Reference Panel */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              <Icon name={showExamples ? "expand_less" : "expand_more"} />
              <span>
                {showExamples ? "Hide" : "Show"} Visual Quality & Hopper Burn Reference Strip
                (Grades 0-4)
              </span>
            </button>

            {showExamples && (
              <div className="mt-3 rounded-2xl border border-border bg-surface p-4 space-y-4 text-xs">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <p className="font-semibold text-primary">ProCrop Photography Tips:</p>
                  <p className="mt-1 text-muted-foreground">
                    Hold the phone about <strong>15–20 cm from the leaf</strong>, steady, in good
                    natural light. Jassid nymphs sit predominantly on the underside of the foliage
                    along the veins.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border p-2 bg-background">
                    <img
                      src="/examples/good_underside_nymphs.jpg"
                      alt="Good underside nymph shot"
                      className="h-28 w-full object-cover rounded-lg"
                    />
                    <p className="mt-1.5 font-semibold text-foreground">Good: Underside Veins</p>
                    <p className="text-[11px] text-muted-foreground">Sharp focus, clear nymphs</p>
                  </div>
                  <div className="rounded-xl border border-border p-2 bg-background">
                    <img
                      src="/examples/good_adult_closeup.jpg"
                      alt="Adult jassid closeup"
                      className="h-28 w-full object-cover rounded-lg"
                    />
                    <p className="mt-1.5 font-semibold text-foreground">Good: Adult Close-Up</p>
                    <p className="text-[11px] text-muted-foreground">
                      Distinct wedge-shaped hopper
                    </p>
                  </div>
                  <div className="rounded-xl border border-border p-2 bg-background">
                    <img
                      src="/examples/bad_blurry.jpg"
                      alt="Blurry rejection sample"
                      className="h-28 w-full object-cover rounded-lg"
                    />
                    <p className="mt-1.5 font-semibold text-critical">Bad: Motion Blur</p>
                    <p className="text-[11px] text-muted-foreground">
                      Laplacian score &lt; 45 rejected
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-foreground mb-1.5">
                    Hopper Burn Damage Scale Reference (ICCC Grades 0 to 4):
                  </p>
                  <img
                    src="/examples/hopperburn_grades_0_to_4.jpg"
                    alt="Hopper burn reference strip"
                    className="w-full rounded-xl border border-border object-cover max-h-48"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Images sourced from CC BY 4.0 Roboflow datasets. Attributions listed in
                    CREDITS.md and About page.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Drop Zone & Phone Camera Trigger */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) handleFilesAdded(e.dataTransfer.files);
            }}
            className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-8 text-center transition hover:border-primary"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              multiple
              onChange={(e) => {
                if (e.target.files) handleFilesAdded(e.target.files);
              }}
              className="hidden"
            />

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Icon name="add_a_photo" className="text-2xl" />
            </div>

            <p className="mt-4 text-sm font-semibold text-foreground">
              Take photos with camera or drag & drop leaf images
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Automatic client-side compression (max 1600px long side, 0.85 JPEG quality). Up to 8
              MB per file.
            </p>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {isCompressing ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Icon name="photo_camera" className="text-base" />
                )}
                <span>Add Leaf Photos</span>
              </button>
            </div>
          </div>

          {/* Thumbnail Grid with Slot Labels */}
          {photos.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Uploaded Leaf Photos ({photos.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {photos.map((p, idx) => {
                  const slotMeta = TARGET_SLOTS[idx] || { label: `Leaf Photo #${idx + 1}` };
                  return (
                    <div
                      key={p.id}
                      className="group relative rounded-xl border border-border bg-surface overflow-hidden shadow-xs"
                    >
                      <img src={p.previewUrl} alt={p.name} className="h-28 w-full object-cover" />
                      <div className="p-2 text-[11px]">
                        <p className="font-semibold text-foreground truncate">{slotMeta.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{p.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-critical transition cursor-pointer"
                        title="Remove photo"
                      >
                        <Icon name="close" className="text-xs" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              ← Back to Field Info
            </button>

            <button
              type="button"
              disabled={photoCount < 5 || photoCount > 30}
              onClick={() => {
                saveDraftToStorage();
                setCurrentStep(3);
              }}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              <span>Continue to Review →</span>
            </button>
          </div>
        </Panel>
      )}

      {/* ==================== STEP 3: REVIEW & GET RISK ==================== */}
      {currentStep === 3 && (
        <Panel title="Step 3: Review Field Check & Submit" icon="fact_check">
          <p className="text-sm text-muted-foreground mb-6">
            Review your agronomic settings and leaf photo portfolio. When you submit, our backend
            will run quality filtering, pest object detection, hopper burn margin analysis, and the
            retrained risk model.
          </p>

          <div className="space-y-6">
            {/* Field & Agronomy Summary */}
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Field & Agronomic Portfolio</h3>
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Field / Plot:</span>
                  <span className="font-semibold text-foreground">{fieldName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-semibold text-foreground">
                    {district} ({lat}° N, {lon}° E)
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Sowing Date:</span>
                  <span className="font-semibold text-foreground">{sowingDate}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Variety:</span>
                  <span className="font-semibold text-foreground">{variety}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Pubescence Trait:</span>
                  <span className="font-semibold text-foreground">
                    {varietyTrait.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Bt Trait:</span>
                  <span className="font-semibold text-foreground">{btStatus}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Last Spray:</span>
                  <span className="font-semibold text-foreground">
                    {noSprayYet
                      ? "No spray yet"
                      : lastSprayDate
                        ? `${lastSprayDate} (${sprayProductClass})`
                        : "None"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Soil Nitrogen:</span>
                  <span className="font-semibold text-foreground capitalize">{nitrogenLevel}</span>
                </div>
              </div>
            </div>

            {/* Photo Portfolio Summary */}
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-foreground">
                  Photo Evidence: {photos.length} Leaves Uploaded
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    photos.length >= 15
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-amber-500/10 text-amber-700"
                  }`}
                >
                  {photos.length >= 15 ? "High Confidence Expected" : "Low Confidence Expected"}
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photos.slice(0, 15).map((p, idx) => (
                  <img
                    key={p.id}
                    src={p.previewUrl}
                    alt={`Thumb ${idx + 1}`}
                    className="h-16 w-16 rounded-lg object-cover shrink-0 border border-border"
                  />
                ))}
                {photos.length > 15 && (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground shrink-0">
                    +{photos.length - 15} more
                  </div>
                )}
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setCurrentStep(2)}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ← Back to Photos
              </button>

              <button
                type="button"
                disabled={isSubmitting || photos.length < 5 || photos.length > 30}
                onClick={handleSubmitPrediction}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    <span>{submissionProgress}</span>
                  </>
                ) : (
                  <>
                    <Icon name="pest_control" className="text-lg" />
                    <span>Generate Jassid Risk Assessment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
