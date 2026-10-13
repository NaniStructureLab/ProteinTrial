# ProteinTrail — Cross-Database Protein Investigator

**Explore proteins. Trace the evidence.**

ProteinTrail is an interactive educational bioinformatics web application that enables students and researchers to investigate real protein records across authoritative biological databases (**UniProtKB**, **RCSB Protein Data Bank**, and **AlphaFold DB**) through a single, transparent interface.

---

## 1. Local Setup & Execution Instructions

```bash
# 1. Install packages
npm install

# 2. Start the development server on port 3000
npm run dev

# 3. Type-check / Lint
npm run lint

# 4. Build for production
npm run build
```

---

## 2. Compare Protein Module Results Specifications

The Compare Protein tool generates a rigorous 6-part scientific comparison report:

1. **Sequence Alignment**: Aligned rows with exact columns, conservative (`:`), semi-conservative (`.`), mismatch, and gap (`-`) midline annotations.
2. **Percentage Identity**: Explicitly calculates identity with clearly stated denominators:
   - **Including Gaps**: $(\text{Identical Residues} / \text{Total Alignment Columns}) \times 100$
   - **Excluding Gaps**: $(\text{Identical Residues} / \text{Compared Residue Pairs}) \times 100$
3. **Similarity and Substitution Analysis**: Evaluates substitutions using the standard **BLOSUM62** matrix separately from exact matches, classifying changes as conservative ($>0$), semi-conservative ($=0$), or non-conservative ($<0$).
4. **Differences and Mutations**: Granular report listing every substitution, insertion, and deletion relative to Reference Protein A with residue numbering (e.g., `E6V`, `del-23P`), matrix score, and physicochemical property shifts.
5. **Alignment Statistics**: Alignment score, aligned length, identical residue count, conservative substitutions, mismatches, gaps/indels, and coverage percentages for both proteins.
6. **Biological Interpretation**: Contextualizes evolutionary divergence and provides the essential scientific caveat that sequence similarity alone does not establish identical functional mechanism.
