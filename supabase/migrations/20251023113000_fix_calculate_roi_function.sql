-- Fix ambiguous reference and improve ROI calculation
CREATE OR REPLACE FUNCTION public.calculate_roi(p_soc8 text)
RETURNS TABLE (
  occupation_code text,
  industry_sector text,
  annual_wage numeric,
  avg_cost numeric,
  roi_months integer
) LANGUAGE plpgsql AS $$
DECLARE
  v_soc6 text;
  v_sector text;
  v_wage numeric;
  v_cost_low numeric;
  v_cost_high numeric;
  v_avg_cost numeric;
  v_roi_months integer;
BEGIN
  v_soc6 := substring(p_soc8 from '^(\d{2}-\d{4})');
  IF v_soc6 IS NULL THEN
    v_soc6 := p_soc8;
  END IF;

  SELECT med.median_wage_annual
    INTO v_wage
  FROM public.bls_employment_data AS med
  WHERE med.occupation_code_6 = v_soc6
  ORDER BY med.year DESC
  LIMIT 1;

  SELECT CASE enr.career_cluster
           WHEN 'Health Science' THEN 'Healthcare'
           WHEN 'Finance' THEN 'Finance'
           WHEN 'Manufacturing' THEN 'Manufacturing'
           WHEN 'Information Technology' THEN 'Technology'
           WHEN 'Education & Training' THEN 'Education'
           WHEN 'Marketing' THEN 'Retail'
           WHEN 'Transportation, Distribution & Logistics' THEN 'Transportation'
           WHEN 'Law, Public Safety, Corrections & Security' THEN 'Government'
           WHEN 'Government & Public Administration' THEN 'Government'
           WHEN 'Business Management & Administration' THEN 'Business'
           WHEN 'Architecture & Construction' THEN 'Construction'
           WHEN 'Hospitality & Tourism' THEN 'Hospitality'
           WHEN 'Human Services' THEN 'Services'
           WHEN 'Science, Technology, Engineering & Mathematics' THEN 'Technology'
           WHEN 'Agriculture, Food & Natural Resources' THEN 'Agriculture'
           WHEN 'Arts, Audio/Video Technology & Communications' THEN 'Media'
           ELSE NULL
         END
    INTO v_sector
  FROM public.onet_occupation_enrichment AS enr
  WHERE enr.occupation_code = p_soc8
  LIMIT 1;

  IF v_sector IS NULL THEN
    v_sector := 'Technology';
  END IF;

  SELECT avg(econ.implementation_cost_low), avg(econ.implementation_cost_high)
    INTO v_cost_low, v_cost_high
  FROM public.automation_economics AS econ
  WHERE econ.industry_sector = v_sector;

  v_avg_cost := NULL;
  IF v_cost_low IS NOT NULL AND v_cost_high IS NOT NULL THEN
    v_avg_cost := (v_cost_low + v_cost_high) / 2;
  ELSIF v_cost_low IS NOT NULL THEN
    v_avg_cost := v_cost_low;
  ELSIF v_cost_high IS NOT NULL THEN
    v_avg_cost := v_cost_high;
  END IF;

  IF v_wage IS NOT NULL AND v_avg_cost IS NOT NULL AND v_wage > 0 THEN
    v_roi_months := CEIL((v_avg_cost / (v_wage * 0.5)) * 12);
  ELSE
    v_roi_months := NULL;
  END IF;

  RETURN QUERY
  SELECT p_soc8,
         v_sector,
         v_wage,
         v_avg_cost,
         v_roi_months;
END;
$$;

COMMENT ON FUNCTION public.calculate_roi(p_soc8 text) IS 'Estimate ROI months based on sector economics and BLS wages';
