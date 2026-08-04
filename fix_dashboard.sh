sed -i 's/const \[rankingToggle, setRankingToggle\] = useState<'\''VALOR'\'' | '\''VIDAS'\''>('\''VALOR'\'');/const \[rankingToggle, setRankingToggle\] = useState<'\''VALOR'\'' | '\''VIDAS'\''>('\''VALOR'\'');\n  const \[selectedCorretor, setSelectedCorretor\] = useState<string | '\''TODOS'\''>('\''TODOS'\'');\n\n  const corretoresDisponiveis = useMemo(() => {\n    const set = new Set<string>();\n    proposals.forEach(p => {\n      if (p.corretor) set.add(p.corretor);\n    });\n    return Array.from(set).sort();\n  }, [proposals]);/' components/Dashboard.tsx

sed -i 's/const mMatch = selectedMonth === '\''TODOS'\'' || (parseInt(month) - 1) === selectedMonth;/const mMatch = selectedMonth === '\''TODOS'\'' || (parseInt(month) - 1) === selectedMonth;\n      const cMatch = selectedCorretor === '\''TODOS'\'' || p.corretor === selectedCorretor;/' components/Dashboard.tsx

sed -i 's/return mMatch && yMatch;/return mMatch \&\& yMatch \&\& cMatch;/' components/Dashboard.tsx

sed -i 's/const filteredProposals = useMemo(() => {/const filteredProposals = useMemo(() => {/' components/Dashboard.tsx

sed -i 's/}, \[proposals, selectedMonth, selectedYear\]);/}, \[proposals, selectedMonth, selectedYear, selectedCorretor\]);/' components/Dashboard.tsx

