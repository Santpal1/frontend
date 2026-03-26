import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import style from "../components/PublicationTypesDashboard.module.css";
import "../components/SharedPageStyles.css";
import srmLogo from "../assets/srmist-logo.png";
import UserMenu from "../components/UserMenu";
import { useAuth } from "../contexts/AuthContext";

interface FacultyPublicationTypes {
    faculty_id: string;
    faculty_name: string;
    department: string;
    journal_count: number;
    conference_count: number;
    book_count: number;
    total_count: number;
}

export default function PublicationTypesDashboard() {
    const navigate = useNavigate();
    const { getAuthHeaders, user, isAdmin, isHoD, loading } = useAuth();

    const [facultyData, setFacultyData] = useState<FacultyPublicationTypes[]>([]);
    const [filteredData, setFilteredData] = useState<FacultyPublicationTypes[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [departments, setDepartments] = useState<string[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    const fetchDepartments = async () => {
        try {
            const headers = getAuthHeaders();
            const res = await axios.get("http://localhost:5001/api/faculty", { headers });
            const faculties = Array.isArray(res.data) ? res.data : [];
            const unique = Array.from(new Set(
                faculties.map((f: any) => f.department).filter(Boolean)
            ));
            setDepartments(unique);
        } catch (err) {
            console.error("Failed to fetch departments:", err);
        }
    };

    const fetchPublicationTypes = async (dept?: string) => {
        setIsLoading(true);
        setError("");
        try {
            const headers = getAuthHeaders();
            let url = "http://localhost:5001/api/faculty/publication-types/list";
            if (dept && dept !== "all" && isAdmin()) {
                url += `?department=${encodeURIComponent(dept)}`;
            }
            const res = await axios.get(url, { headers });
            const data = res.data.data || [];
            const sortedData = data.sort(
                (a: FacultyPublicationTypes, b: FacultyPublicationTypes) =>
                    b.total_count - a.total_count
            );
            setFacultyData(sortedData);
            applyFilters(sortedData, searchQuery, dept || selectedDepartment);
        } catch (err) {
            console.error("Error fetching publication types:", err);
            setError("Failed to load faculty publication data");
            setFacultyData([]);
            setFilteredData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = (
        data: FacultyPublicationTypes[],
        search: string,
        dept: string
    ) => {
        let filtered = data;
        if (dept && dept !== "all") {
            filtered = filtered.filter((f) => f.department === dept);
        } else if (isHoD()) {
            filtered = filtered.filter((f) => f.department === user?.department);
        }
        if (search.trim()) {
            filtered = filtered.filter(
                (f) =>
                    f.faculty_name.toLowerCase().includes(search.toLowerCase()) ||
                    f.faculty_id.toLowerCase().includes(search.toLowerCase())
            );
        }
        setFilteredData(filtered);
    };

    useEffect(() => {
        if (!loading) {
            fetchDepartments();
            fetchPublicationTypes();
        }
    }, [loading]);

    useEffect(() => {
        applyFilters(facultyData, searchQuery, selectedDepartment);
    }, [searchQuery]);

    const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const dept = e.target.value;
        setSelectedDepartment(dept);
        fetchPublicationTypes(dept);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    if (loading) {
        return (
            <div className={style.pageWrapper}>
                <div className="shared-navbar">
                    <a className="shared-logo">
                        <img src={srmLogo} alt="SRM Logo" className={style.navLogo} />
                        <span>SPM SP</span>
                    </a>
                    <UserMenu />
                </div>
                <div className={style.container}>
                    <div className={style.pageCard}>
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    const totalPublications = filteredData.reduce((sum, f) => sum + f.total_count, 0);

    return (
        <div className={style.pageWrapper}>
            {/* Navbar */}
            <div className="shared-navbar">
                <a className="shared-logo">
                    <img src={srmLogo} alt="SRM Logo" className={style.navLogo} />
                    <span>SPM SP</span>
                </a>
                <UserMenu />
            </div>

            <div className={style.container}>
                <div className={style.pageCard}>

                    {/* Back Button */}
                    <div className={style.backButtonRow}>
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="shared-back-button"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>

                    {/* Page Header */}
                    <div className={style.pageHeader}>
                        <h1 className={style.pageTitle}>Publication Types Dashboard</h1>
                        <div className={style.titleUnderline} />
                        <p className={style.pageSubtitle}>
                            View journals, conferences, and book contributions by faculty
                        </p>
                    </div>

                    {/* Controls */}
                    <div className={style.controlsSection}>
                        {/* Search */}
                        <div className={style.searchGroup}>
                            <label className={style.searchLabel}>Search</label>
                            <div className={style.searchInputWrapper}>
                                <span className={style.searchIcon}>🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search by name, faculty ID..."
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    className={style.searchInput}
                                />
                            </div>
                        </div>

                        {/* Department filter */}
                        {(isAdmin() || isHoD()) && (
                            <div className={style.controlGroup}>
                                <label htmlFor="deptFilter" className={style.filterLabel}>
                                    Department
                                </label>
                                <select
                                    id="deptFilter"
                                    value={selectedDepartment}
                                    onChange={handleDepartmentChange}
                                    className={style.filterDropdown}
                                >
                                    {isAdmin() && <option value="all">All Departments</option>}
                                    {departments.map((dept) => (
                                        <option key={dept} value={dept}>
                                            {dept}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && <div className={style.errorMessage}>{error}</div>}

                    {/* Summary Stats */}
                    {filteredData.length > 0 && (
                        <div className={style.summaryStats}>
                            <div className={style.statCard}>
                                <div className={style.statLabel}>Total Faculty</div>
                                <div className={style.statValue}>{filteredData.length}</div>
                                <div className={style.statHint}>
                                    {selectedDepartment !== "all" ? selectedDepartment : "All Departments"}
                                </div>
                            </div>
                            <div className={style.statCard}>
                                <div className={style.statLabel}>Total Articles</div>
                                <div className={style.statValue}>{totalPublications}</div>
                                <div className={style.statHint}>Across all publication types</div>
                            </div>
                        </div>
                    )}

                    {/* Table Section */}
                    <div className={style.tableSection}>
                        <div className={style.tableSectionHeader}>
                            <span className={style.tableSectionTitle}>
                                📊 Faculty Publication Breakdown
                            </span>
                            {filteredData.length > 0 && (
                                <span className={style.tableSectionCount}>
                                    {filteredData.length} faculty members
                                </span>
                            )}
                        </div>

                        {isLoading ? (
                            <p className={style.loadingMessage}>Loading faculty data...</p>
                        ) : filteredData.length === 0 ? (
                            <p className={style.noDataMessage}>
                                No faculty found matching your criteria
                            </p>
                        ) : (
                            <div className={style.tableWrapper}>
                                <table className={style.publicationTable}>
                                    <thead>
                                        <tr>
                                            <th>Faculty Name</th>
                                            <th>Faculty ID</th>
                                            <th>Department</th>
                                            <th>Journal</th>
                                            <th>Conference</th>
                                            <th>Book</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData.map((faculty) => (
                                            <tr key={faculty.faculty_id} className={style.tableRow}>
                                                <td className={style.cellName}>
                                                    <span
                                                        className={style.clickableName}
                                                        onClick={() =>
                                                            navigate(`/faculty/${faculty.faculty_id}`)
                                                        }
                                                    >
                                                        {faculty.faculty_name}
                                                    </span>
                                                </td>
                                                <td className={style.cellId}>{faculty.faculty_id}</td>
                                                <td className={style.cellDept}>{faculty.department}</td>
                                                <td className={style.cellJournal}>
                                                    <span className={style.badge}>
                                                        {faculty.journal_count}
                                                    </span>
                                                </td>
                                                <td className={style.cellConference}>
                                                    <span className={style.badge}>
                                                        {faculty.conference_count}
                                                    </span>
                                                </td>
                                                <td className={style.cellBook}>
                                                    <span className={style.badge}>
                                                        {faculty.book_count}
                                                    </span>
                                                </td>
                                                <td className={style.cellTotal}>
                                                    <span className={style.badgeTotal}>
                                                        {faculty.total_count}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
