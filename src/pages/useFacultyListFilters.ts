/**
 * useFacultyListFilters
 * Persists all FacultyListPage filter state across navigation.
 * Uses both sessionStorage AND localStorage as fallback for Safari ITP.
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "facultyListFilters_v2"; // bumped version to avoid stale shape

interface FilterState {
  timeframe: string;
  sdgFilter: string;
  domainFilter: string;
  departmentFilter: string;
  searchQuery: string;
  criteriaVisible: boolean;
  criteriaStart: string;
  criteriaEnd: string;
  criteriaPapers: number;
}

const DEFAULT_STATE: FilterState = {
  timeframe: "none",
  sdgFilter: "none",
  domainFilter: "none",
  departmentFilter: "all",
  searchQuery: "",
  criteriaVisible: false,
  criteriaStart: "",
  criteriaEnd: "",
  criteriaPapers: 0,
};

// Try sessionStorage first (same-tab), fall back to localStorage (cross-browser)
function load(): FilterState {
  try {
    const raw =
      sessionStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function save(state: FilterState) {
  const json = JSON.stringify(state);
  try { sessionStorage.setItem(STORAGE_KEY, json); } catch { /* ignore */ }
  try { localStorage.setItem(STORAGE_KEY, json); } catch { /* ignore */ }
}

function clear() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function useFacultyListFilters() {
  const initial = load();

  const [ready,            setReady]               = useState(false);
  const [timeframe,        setTimeframeRaw]        = useState(initial.timeframe);
  const [sdgFilter,        setSdgFilterRaw]        = useState(initial.sdgFilter);
  const [domainFilter,     setDomainFilterRaw]     = useState(initial.domainFilter);
  const [departmentFilter, setDepartmentFilterRaw] = useState(initial.departmentFilter);
  const [searchQuery,      setSearchQueryRaw]      = useState(initial.searchQuery);
  const [criteriaVisible,  setCriteriaVisibleRaw]  = useState(initial.criteriaVisible);
  const [criteriaStart,    setCriteriaStartRaw]    = useState(initial.criteriaStart);
  const [criteriaEnd,      setCriteriaEndRaw]      = useState(initial.criteriaEnd);
  const [criteriaPapers,   setCriteriaPapersRaw]   = useState(initial.criteriaPapers);

  // Signal that the hook has fully hydrated from storage
  useEffect(() => { setReady(true); }, []);

  // Only persist after hydration to avoid overwriting storage with defaults
  useEffect(() => {
    if (!ready) return;
    save({
      timeframe, sdgFilter, domainFilter, departmentFilter,
      searchQuery, criteriaVisible, criteriaStart, criteriaEnd, criteriaPapers,
    });
  }, [ready, timeframe, sdgFilter, domainFilter, departmentFilter,
      searchQuery, criteriaVisible, criteriaStart, criteriaEnd, criteriaPapers]);

  const resetFilters = useCallback(() => {
    setTimeframeRaw("none");
    setSdgFilterRaw("none");
    setDomainFilterRaw("none");
    setDepartmentFilterRaw("all");
    setSearchQueryRaw("");
    setCriteriaVisibleRaw(false);
    setCriteriaStartRaw("");
    setCriteriaEndRaw("");
    setCriteriaPapersRaw(0);
    clear();
  }, []);

  return {
    ready,
    timeframe,        setTimeframe:        setTimeframeRaw,
    sdgFilter,        setSdgFilter:        setSdgFilterRaw,
    domainFilter,     setDomainFilter:     setDomainFilterRaw,
    departmentFilter, setDepartmentFilter: setDepartmentFilterRaw,
    searchQuery,      setSearchQuery:      setSearchQueryRaw,
    criteriaVisible,  setCriteriaVisible:  setCriteriaVisibleRaw,
    criteriaStart,    setCriteriaStart:    setCriteriaStartRaw,
    criteriaEnd,      setCriteriaEnd:      setCriteriaEndRaw,
    criteriaPapers,   setCriteriaPapers:   setCriteriaPapersRaw,
    resetFilters,
  };
}