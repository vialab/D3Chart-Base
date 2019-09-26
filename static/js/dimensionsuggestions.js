class Suggester {
  constructor() {
    this.dataList = [];
    this.dataList[0] = ["search"];
    this.dataList[1] = ["publications", "grants", "patents"];
    this.dataList[2] = ["in", "for", "where", "return"];
    this.filterList = new Map();
    this.filterList.set("publications", [
      "altmetric",
      "altmetric_id",
      "authors",
      "book_doi",
      "category_bra",
      "category_for",
      "category_hra",
      "category_hrcs_hc",
      "category_hrcs_rac",
      "category_rcdc",
      "date",
      "date_inserted",
      "doi",
      "field_citation_ratio",
      "funder_countries",
      "funders",
      "id",
      "issn",
      "issue",
      "journal",
      "journal_lists",
      "mesh_terms",
      "open_access_categories",
      "pages",
      "pmcid",
      "pmid",
      "publisher",
      "recent_citations",
      "reference_ids",
      "relative_citation_ratio",
      "research_org_cities",
      "research_org_countries",
      "research_org_country_names",
      "research_org_state_codes",
      "research_org_state_names",
      "research_orgs",
      "researchers",
      "supporting_grant_ids",
      "times_cited",
      "type",
      "year"
    ]);
    this.filterList.set("grants", [
      "active_year",
      "category_bra",
      "category_hra",
      "category_hrcs_hc",
      "category_hrcs_rac",
      "category_rcdc",
      "date_inserted",
      "end_date",
      "FOR",
      "FOR_first",
      "funder_countries",
      "funders",
      "funding_aud",
      "funding_cad",
      "funding_chf",
      "funding_currency",
      "funding_eur",
      "funding_gbp",
      "funding_jpy",
      "funding_nzd",
      "funding_org_acronym",
      "funding_org_city",
      "funding_org_name",
      "funding_usd",
      "grant_number",
      "id",
      "investigator_details",
      "language",
      "research_org_cities",
      "research_org_countries",
      "research_org_state_codes",
      "research_orgs",
      "researchers",
      "start_date",
      "start_year",
      "title_language"
    ]);
    this.filterList.set("patents", [
      "additional_filters",
      "assignee_cities",
      "assignee_countries",
      "assignee_names",
      "assignee_state_codes",
      "assignee_state_names",
      "assignees",
      "associated_grant_ids",
      "category_bra",
      "category_hra",
      "category_hrcs_hc",
      "category_hrcs_rac",
      "category_rcdc",
      "cited_by_ids",
      "cpc",
      "current_assignee_names",
      "current_assignees",
      "date",
      "date_inserted",
      "expiration_date",
      "filing_status",
      "FOR",
      "FOR_first",
      "funder_groups",
      "funders",
      "granted_date",
      "granted_year",
      "id",
      "inventor_names",
      "ipcr",
      "jurisdiction",
      "legal_status",
      "original_assignee_names",
      "original_assignees",
      "priority_date",
      "priority_year",
      "publication_date",
      "publication_ids",
      "publication_year",
      "reference_ids",
      "times_cited",
      "year"
    ]);
  }

  /**
   * checks if valid query
   * @param  {string} query - expects a query
   * @returns {boolean}
   */
  isValidQuery(query) {
    let segments = query.split(" ");
    for (let i = 0; i < segments.length; i++) {
      if (i < 3) {
        if (!this.dataList[i].includes(segments[i])) {
          return false;
        }
      } else {
        //check filter
      }
    }
    return true;
  }

  suggest(query) {
    let segments = query.split(" ");
    const endElement = segments.length - 1;
    return this.dataList[endElement];
  }
}
