"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { REGION_DATA, PROVINCES } from "./region-data";

type Props = {
  value: string;
  onChange: (timezone: string) => void;
};

export default function CitySelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [province, setProvince] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const found = Object.entries(REGION_DATA).find(([, data]) => data.timezone === value);
      if (found && found[0] !== province) {
        setProvince(found[0]);
        setCity("");
        setDistrict("");
      }
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const cities = useMemo(() => {
    if (!province || !REGION_DATA[province]) return [];
    return Object.keys(REGION_DATA[province].cities);
  }, [province]);

  const districtList = useMemo(() => {
    if (!province || !city || !REGION_DATA[province]?.cities[city]) return [];
    return REGION_DATA[province].cities[city];
  }, [province, city]);

  const selectedLabel = province && city && district
    ? `${province} / ${city} / ${district}`
    : province && city
    ? `${province} / ${city}`
    : province
    ? province
    : "";

  const selectProvince = (p: string) => {
    if (province === p) { setProvince(""); setCity(""); setDistrict(""); }
    else { setProvince(p); setCity(""); setDistrict(""); }
  };
  const selectCity = (c: string) => {
    if (city === c) { setCity(""); setDistrict(""); }
    else { setCity(c); setDistrict(""); }
  };
  const selectDistrict = (d: string) => {
    setDistrict(d);
    onChange(REGION_DATA[province]?.timezone || "");
    setOpen(false);
  };

  const [previewProv, setPreviewProv] = useState<string>("");
  const [previewCity, setPreviewCity] = useState<string>("");
  const displayProv = previewProv || province;
  const displayCity = previewCity || city;

  const previewCities = useMemo(() => {
    if (!displayProv || !REGION_DATA[displayProv]) return [];
    return Object.keys(REGION_DATA[displayProv].cities);
  }, [displayProv]);

  const previewDistricts = useMemo(() => {
    if (!displayProv || !displayCity || !REGION_DATA[displayProv]?.cities[displayCity]) return [];
    return REGION_DATA[displayProv].cities[displayCity];
  }, [displayProv, displayCity]);

  // Dropdown item style — match native <select> option appearance
  const itemStyle = (active: boolean, selected: boolean): React.CSSProperties => ({
    padding: "6px 12px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 13,
    cursor: "pointer",
    background: active ? "#D44115" : "transparent",
    color: active ? "#fff" : selected ? "#D44115" : "#333333",
    whiteSpace: "nowrap",
    transition: "background 0.1s",
    fontWeight: selected ? 600 : 400,
    overflow: "hidden",
    textOverflow: "ellipsis",
  });

  // Trigger style — match native <select>
  const triggerStyle: React.CSSProperties = {
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 38,
    border: "1px solid rgba(13,42,42,0.15)",
    borderRadius: 9,
    background: "#F7F3EE",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 14,
    lineHeight: "38px",
    padding: "0 32px 0 14px",
    color: selectedLabel ? "#333333" : "rgba(51,51,51,0.68)",
    userSelect: "none",
    overflow: "hidden",
    position: "relative",
    outline: "none",
    whiteSpace: "nowrap",
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div onClick={() => setOpen(!open)} style={triggerStyle}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 14, color: "inherit" }}>
          {selectedLabel || "请选择出生地"}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12"
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            flexShrink: 0,
          }}
        >
          <path fill="#555" d="M6 8L1 3h10z"/>
        </svg>
      </div>

      {open && (
        <div
          style={{
            position: "fixed",
            zIndex: 1000,
            marginTop: 4,
            display: "flex",
            background: "#fff",
            border: "1px solid #d0cfc7",
            borderRadius: 8,
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            overflow: "hidden",
            maxHeight: 360,
            minWidth: 480,
            width: "max-content",
          }}
          ref={(el) => {
            if (el && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              el.style.top = (rect.bottom + 4) + "px";
              el.style.left = Math.min(rect.left, window.innerWidth - 500) + "px";
            }
          }}
        >
          <div style={{ width: 110, overflowY: "auto", borderRight: "1px solid #eee", flexShrink: 0 }}>
            {PROVINCES.map((p) => (
              <div key={p}
                onClick={() => selectProvince(p)}
                onMouseEnter={() => { setPreviewProv(p); setPreviewCity(""); }}
                onMouseLeave={() => { setPreviewProv(""); setPreviewCity(""); }}
                style={itemStyle(displayProv === p, province === p)}
              >{p}</div>
            ))}
          </div>
          <div style={{ width: 130, overflowY: "auto", borderRight: (previewDistricts.length > 0 || districtList.length > 0) ? "1px solid #eee" : "none", flexShrink: 0 }}>
            {previewCities.length === 0 ? (
              <div style={{ padding: "12px", color: "#999", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 13 }}>选择省份</div>
            ) : (
              previewCities.map((c) => (
                <div key={c}
                  onClick={() => selectCity(c)}
                  onMouseEnter={() => setPreviewCity(c)}
                  onMouseLeave={() => setPreviewCity("")}
                  style={itemStyle(displayCity === c, city === c)}
                >{c}</div>
              ))
            )}
          </div>
          <div style={{ width: 160, overflowY: "auto", flexShrink: 0 }}>
            {previewDistricts.length === 0 ? (
              <div style={{ padding: "12px", color: "#999", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 13 }}>
                {!displayProv ? "" : !displayCity ? "选择城市" : ""}
              </div>
            ) : (
              previewDistricts.map((d) => (
                <div key={d}
                  onClick={() => selectDistrict(d)}
                  style={{
                    ...itemStyle(false, district === d),
                    color: district === d ? "#D44115" : "#333333",
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "rgba(212,65,21,0.18)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "transparent"; }}
                >{d}</div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
