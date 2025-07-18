import React, { useEffect, useState } from "react";
import "tailwindcss/tailwind.css";
import SortableTable from "./SortedTable";
import SearchBar from "./SearchBar";
import CustomBarChart from "./BarChart";
import { BatchCard } from "./BatchCard";
import Loader from "../Loader/Loader"; // Assuming you have a Loader component
import UpcomingContests from "./UpcomingContests"; // Import the new component
import { FaInfoCircle, FaFilter } from "react-icons/fa"; // Add FaFilter import
import { Link, useSearchParams } from "react-router-dom";
import increamentCounter from "../../libs/increamentCounter";
import MaintenancePage from "../Error/MaintenancePage";
import HeadTags from "../HeadTags/HeadTags";
import RatingLegend from "./RatingLegend";

const Cp = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Add new state for rank display preference
  const [showGlobalRank, setShowGlobalRank] = useState(
    searchParams.get("globalRank") === "true",
  );
  // Replace useState initializations with URL params
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [activePlatform, setActivePlatform] = useState(
    searchParams.get("platform") || "codeforces",
  );
  const [gradFilter, setGradFilter] = useState(
    searchParams.get("grad") || "all",
  );
  const [branchFilter, setBranchFilter] = useState(
    searchParams.get("branch") || "all",
  );
  const [yearFilter, setYearFilter] = useState(
    searchParams.get("year") || "all",
  );
  const [activeStatusFilter, setActiveStatusFilter] = useState(
    searchParams.get("status") || "all",
  );
  const [tempGradFilter, setTempGradFilter] = useState(
    searchParams.get("grad") || "all",
  );
  const [tempBranchFilter, setTempBranchFilter] = useState(
    searchParams.get("branch") || "all",
  );
  const [tempYearFilter, setTempYearFilter] = useState(
    searchParams.get("year") || "all",
  );
  const [studentStatusFilter, setTempStudentStatusFilter] = useState(
    searchParams.get("status") || "all",
  );
  const [userData, setUserData] = useState([]);
  const [batchData, setBatchData] = useState({});
  const [codeforcesLeaderboard, setCodeforcesLeaderboard] = useState([]);
  const [leetcodeLeaderboard, setLeetcodeLeaderboard] = useState([]);
  const [codechefLeaderboard, setCodechefLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true); // Loader state
  const [isError, setIsError] = useState(false);
  // Add new state for filter visibility
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const batchWiseData = {};
        const cfLeaderboard = [];
        const lcLeaderboard = [];
        const ccLeaderboard = [];

        const localData = JSON.parse(
          localStorage.getItem("coding-profile-data"),
        );
        if (
          localData &&
          Date.now() - localData.lastUpdate < 1000 * 60 * 60 * 8
        ) {
          setBatchData(localData.batchData);
          setCodeforcesLeaderboard(localData.codeforcesLeaderboard);
          setLeetcodeLeaderboard(localData.leetcodeLeaderboard);
          setCodechefLeaderboard(localData.codechefLeaderboard);
          setLoading(false);
          return;
        }

        // Fetch platform-specific data
        const [cfProfiles, lcProfiles, ccProfiles] = await Promise.all([
          fetch(
            `${process.env.REACT_APP_BACKEND_BASE_URL}/coding-profiles/users/codeforces`,
          )
            .then((res) => res.json())
            .then((data) => data.data),
          fetch(
            `${process.env.REACT_APP_BACKEND_BASE_URL}/coding-profiles/users/leetcode`,
          )
            .then((res) => res.json())
            .then((data) => data.data),
          fetch(
            `${process.env.REACT_APP_BACKEND_BASE_URL}/coding-profiles/users/codechef`,
          )
            .then((res) => res.json())
            .then((data) => data.data),
        ]);

        // Process Codeforces data
        cfProfiles.forEach((profile) => {
          const batch = profile.admissionNumber.slice(1, 3);
          if (!batchWiseData[batch]) {
            batchWiseData[batch] = {
              Codeforces: { totalRating: 0, userCount: 0 },
              LeetCode: { totalRating: 0, totalSolved: 0, userCount: 0 },
              CodeChef: { totalRating: 0, userCount: 0 },
            };
          }

          const processedData = processCodeforcesData(profile);
          if (processedData) {
            cfLeaderboard.push(processedData);

            if (processedData.rating) {
              batchWiseData[batch].Codeforces.totalRating +=
                processedData.rating;
              batchWiseData[batch].Codeforces.userCount++;
            }
          }
        });

        // Process LeetCode data
        lcProfiles.forEach((profile) => {
          const batch = profile.admissionNumber.slice(1, 3);
          if (!batchWiseData[batch]) {
            batchWiseData[batch] = {
              Codeforces: { totalRating: 0, userCount: 0 },
              LeetCode: { totalRating: 0, totalSolved: 0, userCount: 0 },
              CodeChef: { totalRating: 0, userCount: 0 },
            };
          }

          const userData = profile.data.matchedUser;
          const contestData = profile.data.userContestRanking;

          if (userData) {
            const totalSolved =
              userData.submitStats?.acSubmissionNum[0]?.count || 0;

            lcLeaderboard.push({
              fullName: profile.fullName,
              admissionNumber: profile.admissionNumber,
              leetcodeProfile: userData.username,
              globalRanking: contestData?.globalRanking || "N/A",
              rating: contestData?.rating ? contestData.rating.toFixed(2) : 0,
              totalSolved: totalSolved,
              ContestAttended: contestData?.attendedContestsCount || 0,
            });

            if (contestData?.rating) {
              batchWiseData[batch].LeetCode.totalRating += contestData.rating;
              batchWiseData[batch].LeetCode.totalSolved += totalSolved;
              batchWiseData[batch].LeetCode.userCount++;
            }
          }
        });

        // Process CodeChef data
        ccProfiles.forEach((profile) => {
          const batch = profile.admissionNumber.slice(1, 3);
          if (!batchWiseData[batch]) {
            batchWiseData[batch] = {
              Codeforces: { totalRating: 0, userCount: 0 },
              LeetCode: { totalRating: 0, totalSolved: 0, userCount: 0 },
              CodeChef: { totalRating: 0, userCount: 0 },
            };
          }

          const profileData = profile.data;
          if (profileData && profileData.rating_number) {
            ccLeaderboard.push({
              fullName: profile.fullName,
              admissionNumber: profile.admissionNumber,
              codechefProfile: profileData.username,
              rating_number: profileData.rating_number || 0,
              rating: profileData.rating || "Unrated",
              globalRank: profileData.global_rank || "N/A",
            });

            batchWiseData[batch].CodeChef.totalRating +=
              profileData.rating_number;
            batchWiseData[batch].CodeChef.userCount++;
          }
        });

        // Sort leaderboards by rating before setting state
        cfLeaderboard.sort((a, b) => b.rating - a.rating);
        lcLeaderboard.sort((a, b) => b.rating - a.rating);
        ccLeaderboard.sort((a, b) => b.rating_number - a.rating_number);

        // Calculate averages for each batch
        Object.keys(batchWiseData).forEach((batch) => {
          const data = batchWiseData[batch];
          if (data.Codeforces.userCount > 0) {
            data.Codeforces.avgRating = (
              data.Codeforces.totalRating / data.Codeforces.userCount
            ).toFixed(2);
          }
          if (data.LeetCode.userCount > 0) {
            data.LeetCode.avgRating = (
              data.LeetCode.totalRating / data.LeetCode.userCount
            ).toFixed(2);
            data.LeetCode.avgSolved = (
              data.LeetCode.totalSolved / data.LeetCode.userCount
            ).toFixed(2);
          }
          if (data.CodeChef.userCount > 0) {
            data.CodeChef.avgRating = (
              data.CodeChef.totalRating / data.CodeChef.userCount
            ).toFixed(2);
          }
        });

        setBatchData(batchWiseData);
        setCodeforcesLeaderboard(cfLeaderboard);
        setLeetcodeLeaderboard(lcLeaderboard);
        setCodechefLeaderboard(ccLeaderboard);

        const dataToStore = {
          batchData: batchWiseData,
          codeforcesLeaderboard: cfLeaderboard,
          leetcodeLeaderboard: lcLeaderboard,
          codechefLeaderboard: ccLeaderboard,
          lastUpdate: Date.now(),
        };
        localStorage.setItem(
          "coding-profile-data",
          JSON.stringify(dataToStore),
        );
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    increamentCounter();
  }, []);

  // Add effect to sync URL with state changes
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchTerm) params.set("search", searchTerm);
    if (activePlatform !== "codeforces") params.set("platform", activePlatform);
    if (branchFilter !== "all") params.set("branch", branchFilter);
    if (gradFilter !== "all") params.set("grad", gradFilter);
    if (yearFilter !== "all") params.set("year", yearFilter);
    if (activeStatusFilter !== "all") params.set("status", activeStatusFilter);
    if (showGlobalRank) params.set("globalRank", "true");

    setSearchParams(params, { replace: true });
  }, [
    searchTerm,
    activePlatform,
    branchFilter,
    gradFilter,
    yearFilter,
    activeStatusFilter,
    showGlobalRank,
  ]);

  if (isError) {
    return <MaintenancePage />;
  }

  const addRanksToData = (data) => {
    return data.map((item, index) => ({
      ...item,
      tableRank: index + 1, // Changed to tableRank to avoid conflict with CF rank
    }));
  };

  const isCurrentStudent = (admissionYear) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based

    // Calculate academic year
    const academicYear = currentMonth >= 7 ? currentYear : currentYear - 1;

    // Calculate years since admission
    const yearsSinceAdmission = academicYear - (2000 + parseInt(admissionYear));

    // Student is current if they've been in college for less than 4 years
    return yearsSinceAdmission < 4;
  };

  const filterData = (data) => {
    return data.filter((user) => {
      // Branch and Year filtering
      const uBranch = user.admissionNumber?.substring(3, 5) || "";
      const userBranch = uBranch === "CO" ? "CS" : uBranch; // Treat CO as CS
      const uGrad = user.admissionNumber?.substring(0, 1) || "";
      const userGrad = uGrad === "I" ? "U" : uGrad; // Treat IPG as UG
      const userYear = user.admissionNumber?.substring(1, 3) || "";
      const studentStatus = isCurrentStudent(userYear) ? "current" : "alumni";

      const matchesBranch =
        branchFilter === "all" || userBranch === branchFilter;
      const matchesGrad = gradFilter === "all" || userGrad === gradFilter;
      const matchesYear = yearFilter === "all" || userYear === yearFilter;
      const matchesStatus =
        activeStatusFilter === "all" ||
        (activeStatusFilter === "current" && studentStatus === "current") ||
        (activeStatusFilter === "alumni" && studentStatus === "alumni");
      const matchesSearch =
        !searchTerm ||
        Object.values(user).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase()),
        );

      return (
        matchesBranch &&
        matchesYear &&
        matchesStatus &&
        matchesSearch &&
        matchesGrad
      );
    });
  };

  const getRankData = (data) => {
    if (showGlobalRank) {
      // Return data with global ranks for global view
      return data.map((item, index) => ({
        ...item,
        tableRank: index + 1,
      }));
    } else {
      // First apply filters without search
      const filteredData = data.filter((user) => {
        const uBranch = user.admissionNumber?.substring(3, 5) || "";
        const userBranch = uBranch === "CO" ? "CS" : uBranch; // Treat CO as CS
        const uGrad = user.admissionNumber?.substring(0, 1) || "";
        const userGrad = uGrad === "I" ? "U" : uGrad; // Treat IPG as UG
        const userYear = user.admissionNumber?.substring(1, 3) || "";
        const studentStatus = isCurrentStudent(userYear) ? "current" : "alumni";

        const matchesBranch =
          branchFilter === "all" || userBranch === branchFilter;
        const matchesYear = yearFilter === "all" || userYear === yearFilter;
        const matchesStatus =
          activeStatusFilter === "all" ||
          (activeStatusFilter === "current" && studentStatus === "current") ||
          (activeStatusFilter === "alumni" && studentStatus === "alumni");
        const matchesGrad = gradFilter === "all" || userGrad === gradFilter;

        return matchesBranch && matchesYear && matchesStatus && matchesGrad;
      });

      // Assign ranks based on filtered data (without search)
      const rankedData = filteredData.map((item, index) => ({
        ...item,
        tableRank: index + 1,
      }));

      // If there's a search term, filter the ranked data but preserve the ranks
      if (searchTerm) {
        return rankedData.filter((user) =>
          Object.values(user).some((val) =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase()),
          ),
        );
      }

      return rankedData;
    }
  };

  const columns = {
    codeforces: [
      { Header: "Rank", accessor: "tableRank" }, // Changed to avoid confusion with CF rank
      { Header: "Name", accessor: "fullName" },
      { Header: "Admission Number", accessor: "admissionNumber" },
      {
        Header: "Profile",
        accessor: "codeforcesProfile",
        Cell: ({ value }) => (
          <a
            href={`https://codeforces.com/profile/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline hover:text-blue-300"
          >
            Link
          </a>
        ),
      },
      { Header: "MaxRating", accessor: "maxRating" },
      { Header: "Rating", accessor: "rating" },
      { Header: "CF Rank", accessor: "rank" }, // This should match the property in processCodeforcesData
      { Header: "Latest Contest", accessor: "latestContest" },
      { Header: "Contest Rank", accessor: "contestRanking" },
    ],
    leetcode: [
      { Header: "Rank", accessor: "tableRank" }, // Change to use pre-calculated rank
      { Header: "Name", accessor: "fullName" },
      { Header: "Admission Number", accessor: "admissionNumber" },
      {
        Header: "Profile",
        accessor: "leetcodeProfile",
        Cell: ({ value }) => (
          <a
            href={`https://leetcode.com/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline hover:text-blue-300"
          >
            Link
          </a>
        ),
      },
      { Header: "Global Ranking", accessor: "globalRanking" },
      { Header: "Rating", accessor: "rating" },
      { Header: "Total Solved", accessor: "totalSolved" },
      { Header: "Contest Attended", accessor: "ContestAttended" },
    ],
    codechef: [
      { Header: "Rank", accessor: "tableRank" }, // Change to use pre-calculated rank
      { Header: "Name", accessor: "fullName" },
      { Header: "Admission Number", accessor: "admissionNumber" },
      {
        Header: "Profile",
        accessor: "codechefProfile",
        Cell: ({ value }) => (
          <a
            href={`https://www.codechef.com/users/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline hover:text-blue-300"
          >
            Link
          </a>
        ),
      },
      { Header: "rating_number", accessor: "rating_number" },
      { Header: "Rating", accessor: "rating" },
      { Header: "Global Rank", accessor: "globalRank" },
    ],
  };

  const getPlatformColor = (platform) => {
    return activePlatform === platform
      ? "bg-blue-600 hover:bg-blue-500"
      : "bg-white/10 hover:bg-white/20";
  };

  const processCodeforcesData = (profile) => {
    const userInfo = profile.data[0];
    const contestInfo = profile.data[1];

    return userInfo
      ? {
          fullName: profile.fullName,
          admissionNumber: profile.admissionNumber,
          codeforcesProfile: userInfo.handle,
          rating: userInfo.rating || 0,
          maxRating: userInfo.maxRating || 0,
          rank: userInfo.rank || "Unrated", // This should match the accessor in columns
          latestContest:
            contestInfo?.ratings?.[contestInfo.ratings.length - 1]
              ?.contestName || "No contests",
          contestRanking:
            contestInfo?.ratings?.[contestInfo.ratings.length - 1]?.rank ||
            "N/A",
        }
      : null;
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handlePlatformChange = (platform) => {
    setActivePlatform(platform);
  };

  const handleApplyFilters = () => {
    setBranchFilter(tempBranchFilter);
    setYearFilter(tempYearFilter);
    setGradFilter(tempGradFilter);
    setActiveStatusFilter(studentStatusFilter);
  };

  const handleClearFilters = () => {
    setTempBranchFilter("all");
    setTempYearFilter("all");
    setTempGradFilter("all");
    setTempStudentStatusFilter("all");
    setBranchFilter("all");
    setYearFilter("all");
    setGradFilter("all");
    setActiveStatusFilter("all");
    setSearchTerm("");
    // Clear URL params
    setSearchParams({});
  };

  return (
    <div className="App text-gray-200 min-h-screen py-8 md:mx-24">
      <HeadTags
        title={"Coding Profile LeaderBoard | Nexus - NIT Surat"}
        description={
          "Check out the LeaderBoard of Coding Profiles of different plateforms of students of CSE and AI at NIT Surat."
        }
        keywords={
          "Coding, Competitive Programming, CP, DSA, Data Structure, Algorithm, LeetCode, CodeForces, CodeChef, Coding Culture, Coding Contest, LeaderBoard, Coding Statistics, Placement, Internship"
        }
      />
      {loading ? (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader />
        </div>
      ) : (
        <>
          <div className="mx-2 flex w-fit items-center justify-center gap-3 rounded-md bg-yellow-400/25 p-2 px-4 md:mx-auto ">
            <FaInfoCircle size={42} className="h-auto text-yellow-500" />
            <p className="w-[90%] text-xs text-white/80 md:w-full md:text-base">
              If you registered but did not get your coding profile data here in
              leaderboard, then go to
              <Link
                to="/profile"
                className="mx-1 font-bold text-blue-500  underline underline-offset-4"
              >
                Profile Page
              </Link>
              and turn on "Share Your Coding Profile" feature.
              <br />
              It may take upto{" "}
              <span className="font-bold italic">24 hours</span> to reflect your
              data here.
            </p>
          </div>
          <div className="bg-gray-800 mt-12 rounded-lg p-6 pt-0 shadow-lg">
            {/* Upcoming Contests Component */}
            <UpcomingContests />
            <h2 className="mb-4 border-b border-blue-600 pb-2 text-3xl font-semibold text-blue-400">
              User Report by Platform and Batch
            </h2>
            <CustomBarChart batchData={batchData} />

            {/* Render Batch Data */}
            <div className="mb-8 mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Object.keys(batchData).map((batch) => (
                <BatchCard
                  key={batch}
                  batch={batch}
                  avgCodeforcesRating={batchData[batch].Codeforces.avgRating}
                  avgLeetcodeRating={batchData[batch].LeetCode.avgRating}
                  avgLeetcodeSolved={batchData[batch].LeetCode.avgSolved}
                  avgCodechefRating={batchData[batch].CodeChef.avgRating}
                />
              ))}
            </div>

            <h1 className="mb-4 border-b border-blue-600 pb-2 text-3xl font-semibold  text-blue-400">
              Coding Profile Leaderboard
            </h1>

            {/* Search and Filter Controls */}
            <div className="relative mb-6 mt-10">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
                  <div className="w-full flex-1 md:max-w-fit">
                    <SearchBar
                      placeholder="Search..."
                      onChange={handleSearchChange}
                      initialValue={searchTerm}
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                      showFilters
                        ? "bg-blue-600 hover:bg-blue-500"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <FaFilter
                      className={showFilters ? "text-white" : "text-gray-300"}
                    />
                    <span>Filters</span>
                  </button>
                </div>

                {/* Filters Section */}
                <div
                  className={`transition-all duration-300 ${
                    showFilters
                      ? "max-h-96 opacity-100"
                      : "max-h-0 overflow-hidden opacity-0"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <div className="flex flex-wrap gap-4">
                      <select
                        value={showGlobalRank ? "global" : "filtered"}
                        onChange={(e) =>
                          setShowGlobalRank(e.target.value === "global")
                        }
                        className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white backdrop-blur-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="global" className="bg-slate-900">
                          Nexus Ranking
                        </option>
                        <option value="filtered" className="bg-slate-900">
                          Filtered Ranking
                        </option>
                      </select>
                      {/* ... existing filter selects ... */}
                      <select
                        value={tempBranchFilter}
                        onChange={(e) => setTempBranchFilter(e.target.value)}
                        className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white backdrop-blur-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="all" className="bg-slate-900">
                          All Branches
                        </option>
                        <option value="CS" className="bg-slate-900">
                          CS/CO
                        </option>
                        <option value="AI" className="bg-slate-900">
                          AI
                        </option>
                        <option value="DS" className="bg-slate-900">
                          DS
                        </option>
                        <option value="IS" className="bg-slate-900">
                          IS
                        </option>
                      </select>

                      <select
                        value={tempGradFilter}
                        onChange={(e) => setTempGradFilter(e.target.value)}
                        className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white backdrop-blur-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="all" className="bg-slate-900">
                          All Graduation Levels
                        </option>
                        <option value="U" className="bg-slate-900">
                          UG
                        </option>
                        <option value="P" className="bg-slate-900">
                          PG
                        </option>
                        <option value="D" className="bg-slate-900">
                          PhD
                        </option>
                      </select>

                      <select
                        value={tempYearFilter}
                        onChange={(e) => setTempYearFilter(e.target.value)}
                        className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white backdrop-blur-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="all" className="bg-slate-900">
                          All Years
                        </option>
                        <option value="21" className="bg-slate-900">
                          2021
                        </option>
                        <option value="22" className="bg-slate-900">
                          2022
                        </option>
                        <option value="23" className="bg-slate-900">
                          2023
                        </option>
                        <option value="24" className="bg-slate-900">
                          2024
                        </option>
                      </select>

                      <select
                        value={studentStatusFilter}
                        onChange={(e) =>
                          setTempStudentStatusFilter(e.target.value)
                        }
                        className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white backdrop-blur-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="all" className="bg-slate-900">
                          All Students
                        </option>
                        <option value="current" className="bg-slate-900">
                          Current Students
                        </option>
                        <option value="alumni" className="bg-slate-900">
                          Alumni
                        </option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleApplyFilters}
                        className="rounded-lg bg-blue-600 px-4 py-2 transition-colors hover:bg-blue-500"
                      >
                        Apply Filters
                      </button>
                      <button
                        onClick={handleClearFilters}
                        className="rounded-lg bg-white/10 px-4 py-2 transition-colors hover:bg-white/20"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Toggle Buttons */}
            <div className="mb-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => handlePlatformChange("codeforces")}
                className={`rounded-lg px-3 py-2 font-semibold transition-colors md:px-4 md:py-2 ${getPlatformColor(
                  "codeforces",
                )} hover:bg-blue-500`}
              >
                Codeforces
              </button>
              <button
                onClick={() => handlePlatformChange("leetcode")}
                className={`rounded-lg px-3 py-2 font-semibold transition-colors md:px-4 md:py-2 ${getPlatformColor(
                  "leetcode",
                )} hover:bg-blue-500`}
              >
                LeetCode
              </button>
              <button
                onClick={() => handlePlatformChange("codechef")}
                className={`rounded-lg px-3 py-2 font-semibold transition-colors md:px-4 md:py-2 ${getPlatformColor(
                  "codechef",
                )} hover:bg-blue-500`}
              >
                CodeChef
              </button>
            </div>

            {/* Conditional Table Rendering */}
            {activePlatform === "codeforces" && (
              <>
                <RatingLegend platform="codeforces" />
                <SortableTable
                  columns={columns.codeforces}
                  data={filterData(getRankData(codeforcesLeaderboard))}
                />
              </>
            )}

            {activePlatform === "leetcode" && (
              <>
                <h2 className="mb-4 border-b border-blue-600 pb-2 text-3xl font-semibold text-blue-400">
                  LeetCode Leaderboard
                </h2>
                <RatingLegend platform="leetcode" />
                <SortableTable
                  columns={columns.leetcode}
                  data={filterData(getRankData(leetcodeLeaderboard))}
                />
              </>
            )}

            {activePlatform === "codechef" && (
              <>
                <h2 className="mb-4 border-b border-blue-600 pb-2 text-3xl font-semibold text-blue-400">
                  CodeChef Leaderboard
                </h2>
                <RatingLegend platform="codechef" />
                <SortableTable
                  columns={columns.codechef}
                  data={filterData(getRankData(codechefLeaderboard))}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Cp;
