"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface GeocodeResult {
  id: string;
  label: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface GeocodeInitial {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

const GEOCODE_DEBOUNCE_MS = 700;
const GEOCODE_MIN_LENGTH = 5;

async function geocodeAddress(
  query: string,
  signal: AbortSignal,
): Promise<GeocodeResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const results = (await res.json()) as Array<{
    place_id?: number;
    display_name?: string;
    address?: Record<string, string>;
  }>;
  return results
    .filter((r) => r.address)
    .map((r) => {
      const addr = r.address!;
      const houseAndRoad = [addr.house_number, addr.road].filter(Boolean).join(" ");
      return {
        id: String(r.place_id ?? r.display_name),
        label: r.display_name ?? "",
        address: houseAndRoad || undefined,
        city: addr.city ?? addr.town ?? addr.village ?? addr.county,
        state: addr.state,
        country: addr.country,
      };
    });
}

export function useGeocode(initial: GeocodeInitial | null = null) {
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [geocoding, setGeocoding] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeAbort = useRef<AbortController | null>(null);

  const runGeocode = useCallback((query: string) => {
    geocodeAbort.current?.abort();
    const controller = new AbortController();
    geocodeAbort.current = controller;
    setGeocoding(true);
    geocodeAddress(query, controller.signal)
      .then((results) => {
        setSuggestions(results);
        setSuggestionsOpen(results.length > 0);
      })
      .catch(() => {})
      .finally(() => setGeocoding(false));
  }, []);

  const onAddressChange = useCallback(
    (value: string) => {
      setAddress(value);
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      if (!value.trim()) {
        geocodeAbort.current?.abort();
        setGeocoding(false);
        setSuggestions([]);
        setSuggestionsOpen(false);
        setCity("");
        setState("");
        setCountry("");
        return;
      }
      if (value.trim().length < GEOCODE_MIN_LENGTH) {
        setSuggestions([]);
        setSuggestionsOpen(false);
        return;
      }
      geocodeTimer.current = setTimeout(
        () => runGeocode(value.trim()),
        GEOCODE_DEBOUNCE_MS,
      );
    },
    [runGeocode],
  );

  const onSelectSuggestion = useCallback((result: GeocodeResult) => {
    setAddress(result.address || result.label);
    setCity(result.city ?? "");
    setState(result.state ?? "");
    setCountry(result.country ?? "");
    setSuggestions([]);
    setSuggestionsOpen(false);
    geocodeAbort.current?.abort();
    setGeocoding(false);
  }, []);

  const onSuggestionsClose = useCallback(() => {
    window.setTimeout(() => setSuggestionsOpen(false), 150);
  }, []);

  useEffect(() => {
    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      geocodeAbort.current?.abort();
    };
  }, []);

  return {
    address,
    setAddress: onAddressChange,
    city,
    setCity,
    state,
    setState,
    country,
    setCountry,
    geocoding,
    suggestions,
    suggestionsOpen,
    setSuggestionsOpen,
    onSelectSuggestion,
    onSuggestionsClose,
  };
}