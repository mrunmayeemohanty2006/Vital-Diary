/**
 * Deterministic Clinical Knowledge Base for Lab & Health Insights
 * 
 * Sourced from authoritative, peer-reviewed clinical guidelines:
 * - NIH / U.S. National Library of Medicine (MedlinePlus)
 * - Mayo Clinic Medical Information
 * - CDC (Centers for Disease Control and Prevention)
 * - American Heart Association (AHA)
 * - American Diabetes Association (ADA)
 * - National Kidney Foundation (NKF)
 * - NHS UK Clinical Guidance
 * 
 * 100% Deterministic & Local — No AI/LLM inference.
 * Educational only; does not diagnose, prescribe, or claim cures.
 */

export const CLINICAL_INSIGHTS_KB = {
  hemoglobin: {
    name: 'Hemoglobin',
    category: 'Hematology',
    unit: 'g/dL',
    defaultRange: { low: 12.0, high: 16.5 },
    low: {
      statusLabel: 'Low Hemoglobin (Anemia Range)',
      meaning: 'Hemoglobin is the iron-rich protein in red blood cells that transports oxygen from the lungs to the body tissues. A low level indicates that red blood cells are carrying less oxygen than normal.',
      commonCauses: [
        'Iron deficiency (nutritional or blood loss)',
        'Vitamin B12 or folate deficiency',
        'Recent blood loss or heavy menstrual cycles',
        'Chronic inflammatory or kidney conditions',
        'Decreased bone marrow red cell production',
      ],
      management: [
        'Incorporate iron-rich foods (lean meats, legumes, spinach, fortified cereals) paired with Vitamin C to enhance absorption.',
        'Ensure adequate intake of Vitamin B12 and folate through balanced nutrition.',
        'Avoid consuming calcium, tea, or coffee simultaneously with iron-rich meals, as they inhibit iron uptake.',
        'Maintain consistent hydration and avoid sudden strenuous exertion if fatigued.',
      ],
      whenToConsultDoctor: [
        'Severe, persistent fatigue, dizziness, or shortness of breath on mild exertion.',
        'Chest pain, rapid heart palpitations, or pale/cold extremities.',
        'Known history of unexplained blood loss or black/tarry stools.',
      ],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'Hemoglobin Test', url: 'https://medlineplus.gov/lab-tests/hemoglobin-test/' },
        { name: 'Mayo Clinic', topic: 'Anemia - Symptoms & Causes', url: 'https://www.mayoclinic.org/diseases-conditions/anemia/symptoms-causes/syc-20351360' },
        { name: 'NHS UK', topic: 'Iron Deficiency Anemia', url: 'https://www.nhs.uk/conditions/iron-deficiency-anaemia/' },
      ],
    },
    high: {
      statusLabel: 'High Hemoglobin (Elevated)',
      meaning: 'An elevated hemoglobin concentration indicates a higher-than-normal concentration of oxygen-carrying proteins in the blood, often reflecting compensation for low oxygen levels or decreased blood plasma volume.',
      commonCauses: [
        'Dehydration or reduced fluid intake (concentrating the blood)',
        'Living at high altitudes',
        'Tobacco smoking or chronic respiratory compromise (COPD)',
        'Polycythemia vera or excess bone marrow production',
      ],
      management: [
        'Increase daily hydration with adequate water intake to ensure optimal plasma volume.',
        'Avoid or cease tobacco smoking to reduce carbon monoxide-induced red cell overproduction.',
        'Review any current high-altitude exposure or unprescribed performance supplements.',
      ],
      whenToConsultDoctor: [
        'Unexplained frequent headaches, dizziness, or blurred vision.',
        'Redness or itching, particularly after a warm shower.',
        'Shortness of breath or unexplained bruising.',
      ],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'Hemoglobin Test', url: 'https://medlineplus.gov/lab-tests/hemoglobin-test/' },
        { name: 'Mayo Clinic', topic: 'High Hemoglobin Count', url: 'https://www.mayoclinic.org/symptoms/high-hemoglobin-count/basics/definition/sym-20050862' },
      ],
    },
  },

  glucose: {
    name: 'Fasting Blood Glucose',
    category: 'Metabolic & Diabetes',
    unit: 'mg/dL',
    defaultRange: { low: 70, high: 99 },
    low: {
      statusLabel: 'Low Glucose (Hypoglycemia)',
      meaning: 'Blood glucose is the primary source of energy for cellular function. Levels below the reference range indicate insufficient circulating sugar.',
      commonCauses: [
        'Prolonged fasting, delayed meals, or intense exercise without carbohydrate intake',
        'Medication effects (e.g. insulin or sulfonylureas in treated individuals)',
        'Excessive alcohol consumption without food',
        'Endocrine irregularities affecting cortisol or growth hormone',
      ],
      management: [
        'Consume 15–20 grams of fast-acting carbohydrates (e.g. 4 oz juice, glucose tablets) if experiencing acute mild symptoms.',
        'Eat balanced meals with complex carbohydrates, protein, and dietary fiber at regular intervals.',
        'Avoid excessive alcohol, especially on an empty stomach.',
      ],
      whenToConsultDoctor: [
        'Frequent or unexplained episodes of shakiness, sweating, confusion, or fainting.',
        'Blood sugar dropping below 54 mg/dL without clear explanation.',
        'Taking diabetes medications and experiencing recurrent hypoglycemia.',
      ],
      sources: [
        { name: 'American Diabetes Association', topic: 'Hypoglycemia (Low Blood Glucose)', url: 'https://diabetes.org/living-with-diabetes/treatment-care/hypoglycemia' },
        { name: 'NIH MedlinePlus', topic: 'Blood Glucose Test', url: 'https://medlineplus.gov/lab-tests/blood-glucose-test/' },
        { name: 'CDC', topic: 'Manage Low Blood Sugar', url: 'https://www.cdc.gov/diabetes/basics/low-blood-sugar.html' },
      ],
    },
    high: {
      statusLabel: 'High Glucose (Hyperglycemia / Impaired Fasting Glucose)',
      meaning: 'Fasting glucose levels above the reference range indicate that the body is having difficulty transporting glucose from the bloodstream into cells, commonly associated with insulin resistance or prediabetes.',
      commonCauses: [
        'Impaired insulin sensitivity or prediabetes / diabetes mellitus',
        'Recent high-glycemic meals or incomplete fasting before testing',
        'Acute physiological stress, infection, or sleep deprivation',
        'Corticosteroid medications or other metabolic agents',
      ],
      management: [
        'Adopt a Mediterranean or whole-food diet rich in fiber, non-starchy vegetables, and lean proteins while minimizing refined sugars and sugary beverages.',
        'Engage in at least 150 minutes of moderate aerobic exercise (e.g. brisk walking) and 2 resistance sessions weekly.',
        'Maintain a consistent sleep routine and practice stress-reduction techniques.',
      ],
      whenToConsultDoctor: [
        'Fasting glucose repeatedly above 100 mg/dL (prediabetes range) or above 126 mg/dL (diabetes threshold).',
        'Symptoms of excessive thirst, frequent urination, unexplained weight loss, or persistent fatigue.',
        'Need for structured HbA1c testing and comprehensive metabolic evaluation.',
      ],
      sources: [
        { name: 'American Diabetes Association', topic: 'Diagnosis & Classification of Diabetes', url: 'https://diabetes.org/diabetes/a1c-diagnosis' },
        { name: 'CDC', topic: 'Prediabetes - Your Chance to Prevent Type 2', url: 'https://www.cdc.gov/diabetes/basics/prediabetes.html' },
        { name: 'Mayo Clinic', topic: 'Hyperglycemia in Diabetes', url: 'https://www.mayoclinic.org/diseases-conditions/hyperglycemia/symptoms-causes/syc-20373631' },
      ],
    },
  },

  hba1c: {
    name: 'HbA1c (Glycated Hemoglobin)',
    category: 'Metabolic & Diabetes',
    unit: '%',
    defaultRange: { low: 4.0, high: 5.6 },
    high: {
      statusLabel: 'Elevated HbA1c (Prediabetes / Diabetes Indicator)',
      meaning: 'HbA1c measures the percentage of hemoglobin bound to glucose over the past 2 to 3 months, reflecting average medium-term blood sugar levels.',
      commonCauses: [
        'Chronic insulin resistance or type 2 diabetes mellitus',
        'High glycemic dietary pattern and sedentary lifestyle',
        'Metabolic syndrome or abdominal adiposity',
      ],
      management: [
        'Prioritize low-glycemic, fiber-rich whole foods while reducing refined carbohydrates and sugar-sweetened drinks.',
        'Establish regular daily physical movement (walking after meals significantly reduces glucose spikes).',
        'Maintain routine monitoring every 3 to 6 months as advised by your healthcare team.',
      ],
      whenToConsultDoctor: [
        'HbA1c between 5.7% and 6.4% indicates prediabetes; 6.5% or above indicates diabetes on two separate tests.',
        'Consult your physician for individualized dietary plans, lifestyle interventions, or therapeutic review.',
      ],
      sources: [
        { name: 'American Diabetes Association', topic: 'Understanding A1C', url: 'https://diabetes.org/living-with-diabetes/treatment-care/a1c' },
        { name: 'NIH MedlinePlus', topic: 'Hemoglobin A1C (HbA1c) Test', url: 'https://medlineplus.gov/lab-tests/hemoglobin-a1c-hba1c-test/' },
        { name: 'CDC', topic: 'All About Your A1C', url: 'https://www.cdc.gov/diabetes/managing/managing-blood-sugar/a1c.html' },
      ],
    },
    low: {
      statusLabel: 'Low HbA1c',
      meaning: 'HbA1c below standard reference ranges may reflect shortened red blood cell lifespan, recent significant blood loss, or frequent hypoglycemia.',
      commonCauses: ['Hemolytic anemia', 'Recent blood transfusion or acute blood loss', 'Chronic severe hypoglycemia'],
      management: ['Maintain a balanced, nutritious diet and review overall red blood cell counts with your doctor.'],
      whenToConsultDoctor: ['Unexplained low values accompanied by fatigue, weakness, or lightheadedness.'],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'Hemoglobin A1C (HbA1c) Test', url: 'https://medlineplus.gov/lab-tests/hemoglobin-a1c-hba1c-test/' },
      ],
    },
  },

  total_cholesterol: {
    name: 'Total Cholesterol',
    category: 'Lipid Panel',
    unit: 'mg/dL',
    defaultRange: { low: 120, high: 199 },
    high: {
      statusLabel: 'Elevated Total Cholesterol (Hypercholesterolemia)',
      meaning: 'Total cholesterol represents the overall amount of cholesterol (including LDL, HDL, and VLDL) in the blood. Elevated levels are associated with increased long-term atherosclerotic plaque buildup.',
      commonCauses: [
        'High intake of dietary saturated fats and trans-fats',
        'Familial or genetic lipid tendencies',
        'Physical inactivity and excess visceral adiposity',
        'Underactive thyroid (hypothyroidism) or metabolic conditions',
      ],
      management: [
        'Substitute saturated fats (butter, fatty meats) with healthy unsaturated fats (olive oil, avocados, nuts, seeds).',
        'Increase soluble dietary fiber (oats, legumes, psyllium, apples) to promote cholesterol excretion.',
        'Engage in regular aerobic exercise (150+ minutes per week) to improve overall lipid balance.',
      ],
      whenToConsultDoctor: [
        'Total cholesterol consistently at or above 200 mg/dL (borderline) or 240 mg/dL (high).',
        'Family history of premature cardiovascular events, heart attack, or stroke.',
      ],
      sources: [
        { name: 'American Heart Association', topic: 'What Your Cholesterol Levels Mean', url: 'https://www.heart.org/en/health-topics/cholesterol/about-cholesterol/what-your-cholesterol-levels-mean' },
        { name: 'NIH MedlinePlus', topic: 'Cholesterol Levels', url: 'https://medlineplus.gov/cholesterollevel.html' },
        { name: 'Mayo Clinic', topic: 'High Cholesterol Management', url: 'https://www.mayoclinic.org/diseases-conditions/high-blood-cholesterol/symptoms-causes/syc-20350800' },
      ],
    },
    low: {
      statusLabel: 'Low Total Cholesterol',
      meaning: 'Significantly low cholesterol is uncommon and can indicate severe malnutrition, malabsorption, or hyperthyroidism.',
      commonCauses: ['Severe malnutrition or very low-fat dietary restriction', 'Malabsorption syndromes', 'Hyperthyroidism or chronic liver disease'],
      management: ['Ensure adequate intake of healthy fats and complete nutritional diversity.'],
      whenToConsultDoctor: ['Unintentional weight loss, extreme fatigue, or digestive issues.'],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'Cholesterol Levels', url: 'https://medlineplus.gov/cholesterollevel.html' },
      ],
    },
  },

  ldl_cholesterol: {
    name: 'LDL Cholesterol',
    category: 'Lipid Panel',
    unit: 'mg/dL',
    defaultRange: { low: 50, high: 99 },
    high: {
      statusLabel: 'Elevated LDL Cholesterol ("Bad" Cholesterol)',
      meaning: 'LDL (Low-Density Lipoprotein) transports cholesterol to peripheral tissues. Excess circulating LDL can penetrate and oxidize within arterial walls, contributing to plaque buildup (atherosclerosis).',
      commonCauses: [
        'Diet rich in saturated fats and refined sugars',
        'Genetic lipid disorders (familial hypercholesterolemia)',
        'Sedentary lifestyle and overweight',
        'Smoking (which oxidizes LDL particles)',
      ],
      management: [
        'Reduce dietary saturated fat to under 6% of total daily calories.',
        'Add plant sterols/stanols and 10–25g daily of soluble fiber.',
        'Participate in consistent aerobic exercise and maintain healthy body composition.',
      ],
      whenToConsultDoctor: [
        'LDL at or above 100 mg/dL for individuals with cardiovascular risk factors, or above 160 mg/dL for general population.',
        'Assessment of overall 10-year cardiovascular risk score and lipid-lowering therapy evaluation.',
      ],
      sources: [
        { name: 'American Heart Association', topic: 'LDL and HDL Cholesterol: "Bad" and "Good" Cholesterol', url: 'https://www.heart.org/en/health-topics/cholesterol/hdl-good-ldl-bad-cholesterol-and-triglycerides' },
        { name: 'NIH MedlinePlus', topic: 'LDL: The "Bad" Cholesterol', url: 'https://medlineplus.gov/ldlthebadcholesterol.html' },
      ],
    },
    low: {
      statusLabel: 'Low LDL Cholesterol',
      meaning: 'Generally considered optimal for cardiovascular protection; extremely low levels are rarely of concern unless accompanied by malnutrition.',
      commonCauses: ['High-dose lipid lowering therapy', 'Genetic hypolipidemia', 'Malnutrition'],
      management: ['Maintain a balanced, nutrient-dense diet.'],
      whenToConsultDoctor: ['Consult only if you have symptoms of severe malabsorption or rapid unexpected weight loss.'],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'Cholesterol Test', url: 'https://medlineplus.gov/lab-tests/cholesterol-levels/' },
      ],
    },
  },

  hdl_cholesterol: {
    name: 'HDL Cholesterol',
    category: 'Lipid Panel',
    unit: 'mg/dL',
    defaultRange: { low: 40, high: 90 },
    low: {
      statusLabel: 'Low HDL Cholesterol ("Good" Cholesterol Sub-optimal)',
      meaning: 'HDL (High-Density Lipoprotein) performs reverse cholesterol transport, clearing excess cholesterol from the arterial walls and delivering it to the liver for excretion. Low levels reduce this protective mechanism.',
      commonCauses: [
        'Sedentary lifestyle and lack of aerobic exercise',
        'Tobacco smoking',
        'Diet high in refined carbohydrates and trans-fats',
        'Metabolic syndrome and insulin resistance',
      ],
      management: [
        'Incorporate 30–45 minutes of moderate-to-vigorous aerobic exercise 5 days per week.',
        'Cease tobacco use (quitting smoking is directly linked to increased HDL levels).',
        'Include healthy monounsaturated and omega-3 fatty acids (extra virgin olive oil, wild salmon, flaxseeds).',
      ],
      whenToConsultDoctor: [
        'HDL below 40 mg/dL (men) or below 50 mg/dL (women), especially alongside elevated triglycerides or high blood pressure.',
      ],
      sources: [
        { name: 'American Heart Association', topic: 'HDL (Good) Cholesterol', url: 'https://www.heart.org/en/health-topics/cholesterol/hdl-good-ldl-bad-cholesterol-and-triglycerides' },
        { name: 'Mayo Clinic', topic: 'HDL Cholesterol: How to Boost Your Good Cholesterol', url: 'https://www.mayoclinic.org/diseases-conditions/high-blood-cholesterol/in-depth/hdl-cholesterol/art-20046388' },
      ],
    },
    high: {
      statusLabel: 'High HDL Cholesterol (Cardioprotective Range)',
      meaning: 'High HDL is typically associated with lower cardiovascular risk and effective reverse cholesterol transport.',
      commonCauses: ['Aerobic conditioning', 'Healthy unsaturated fat intake', 'Genetic factors'],
      management: ['Maintain your active lifestyle and heart-healthy dietary habits.'],
      whenToConsultDoctor: ['Usually does not require medical intervention unless extremely elevated (>100 mg/dL) with genetic anomalies.'],
      sources: [
        { name: 'American Heart Association', topic: 'Cholesterol Guidelines', url: 'https://www.heart.org/en/health-topics/cholesterol' },
      ],
    },
  },

  triglycerides: {
    name: 'Triglycerides',
    category: 'Lipid Panel',
    unit: 'mg/dL',
    defaultRange: { low: 50, high: 149 },
    high: {
      statusLabel: 'Elevated Triglycerides (Hypertriglyceridemia)',
      meaning: 'Triglycerides are the most common type of fat in the body, derived from surplus dietary calories. Elevated triglycerides are a hallmark marker of metabolic syndrome and cardiovascular risk.',
      commonCauses: [
        'High consumption of refined sugars, simple carbohydrates, and processed foods',
        'Regular or excess alcohol intake',
        'Sedentary lifestyle and excess weight',
        'Uncontrolled diabetes or thyroid dysfunction',
      ],
      management: [
        'Significantly limit added sugars, sweets, baked goods, and sugar-sweetened beverages.',
        'Reduce or eliminate alcohol consumption.',
        'Incorporate omega-3 fatty acids (fatty fish, chia seeds, walnuts) and engage in routine physical exercise.',
      ],
      whenToConsultDoctor: [
        'Triglycerides above 150 mg/dL (borderline high), above 200 mg/dL (high), or above 500 mg/dL (very high, requiring prompt medical management to prevent pancreatitis).',
      ],
      sources: [
        { name: 'American Heart Association', topic: 'Triglycerides and Heart Health', url: 'https://www.heart.org/en/health-topics/cholesterol/about-cholesterol/triglycerides' },
        { name: 'Mayo Clinic', topic: 'Triglycerides: Why do they matter?', url: 'https://www.mayoclinic.org/diseases-conditions/high-blood-cholesterol/in-depth/triglycerides/art-20048186' },
      ],
    },
    low: {
      statusLabel: 'Low Triglycerides',
      meaning: 'Low triglycerides are uncommon and generally benign, typically reflecting a low-fat diet or high metabolic activity.',
      commonCauses: ['Extremely low-fat diet', 'Hyperthyroidism', 'Malnutrition'],
      management: ['Ensure adequate, balanced dietary caloric and healthy fat intake.'],
      whenToConsultDoctor: ['Significant unexplained weight loss or nutrient deficiencies.'],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'Triglycerides Test', url: 'https://medlineplus.gov/lab-tests/triglycerides-test/' },
      ],
    },
  },

  creatinine: {
    name: 'Serum Creatinine',
    category: 'Renal & Kidney Function',
    unit: 'mg/dL',
    defaultRange: { low: 0.6, high: 1.2 },
    high: {
      statusLabel: 'Elevated Serum Creatinine (Kidney Filtration Marker)',
      meaning: 'Creatinine is a normal byproduct of muscle metabolism cleared exclusively by the kidneys. Elevated levels suggest reduced glomerular filtration rate or temporary dehydration.',
      commonCauses: [
        'Dehydration or insufficient fluid intake',
        'Intense strenuous resistance exercise right before testing',
        'High dietary intake of cooked meat or creatine supplements',
        'Reduced kidney filtration or acute/chronic kidney conditions',
        'Certain medications (e.g. NSAIDs, certain blood pressure drugs)',
      ],
      management: [
        'Drink adequate water throughout the day (unless on fluid restriction prescribed by a doctor).',
        'Avoid excessive non-steroidal anti-inflammatory drugs (NSAIDs like ibuprofen) which can stress kidney filtration.',
        'Temporarily pause heavy creatine supplementation before repeat testing.',
      ],
      whenToConsultDoctor: [
        'Creatinine above reference range, especially with elevated blood pressure or decreased urine output.',
        'History of diabetes, hypertension, or swelling in the legs/ankles (edema).',
      ],
      sources: [
        { name: 'National Kidney Foundation', topic: 'Creatinine and Kidney Function', url: 'https://www.kidney.org/atoz/content/what-is-creatinine' },
        { name: 'NIH MedlinePlus', topic: 'Creatinine Test', url: 'https://medlineplus.gov/lab-tests/creatinine-test/' },
        { name: 'Mayo Clinic', topic: 'Creatinine Test Overview', url: 'https://www.mayoclinic.org/tests-procedures/creatinine-test/about/pac-20384646' },
      ],
    },
    low: {
      statusLabel: 'Low Serum Creatinine',
      meaning: 'Low creatinine typically reflects reduced muscle mass or lower protein intake, and is rarely a sign of serious kidney disease.',
      commonCauses: ['Low muscle mass or advanced age', 'Strict low-protein diet', 'Pregnancy (due to increased renal blood flow)'],
      management: ['Ensure adequate dietary protein and engage in safe resistance exercises to support muscle preservation.'],
      whenToConsultDoctor: ['Unexplained severe muscle weakness or involuntary weight loss.'],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'Creatinine Test', url: 'https://medlineplus.gov/lab-tests/creatinine-test/' },
      ],
    },
  },

  platelets: {
    name: 'Platelet Count',
    category: 'Hematology & Clotting',
    unit: 'cells/uL',
    defaultRange: { low: 150000, high: 450000 },
    low: {
      statusLabel: 'Low Platelet Count (Thrombocytopenia)',
      meaning: 'Platelets are cellular fragments essential for blood clotting and stopping bleeding. A low count increases the susceptibility to bruising and prolonged bleeding.',
      commonCauses: [
        'Recent viral infection (e.g. influenza, dengue, COVID-19)',
        'Certain medications (e.g. antibiotics, heparin, NSAIDs)',
        'Nutritional deficiencies (Vitamin B12, folate)',
        'Autoimmune destruction of platelets or splenic sequestration',
      ],
      management: [
        'Avoid contact sports or high-impact activities while platelet counts are low to prevent injury.',
        'Use a soft-bristled toothbrush and avoid medications that impair clotting (such as aspirin or ibuprofen) unless specifically prescribed.',
        'Ensure adequate nutrition rich in folate and Vitamin B12.',
      ],
      whenToConsultDoctor: [
        'Unexplained spontaneous bruising, pinpoint red spots on skin (petechiae), or prolonged bleeding from minor cuts.',
        'Platelet count under 100,000 cells/uL or any signs of bleeding (gums, urine, stool).',
      ],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'Platelet Count Test', url: 'https://medlineplus.gov/lab-tests/platelet-count-test/' },
        { name: 'Mayo Clinic', topic: 'Thrombocytopenia (Low Platelet Count)', url: 'https://www.mayoclinic.org/diseases-conditions/thrombocytopenia/symptoms-causes/syc-20378293' },
      ],
    },
    high: {
      statusLabel: 'High Platelet Count (Thrombocytosis)',
      meaning: 'An elevated platelet count is commonly a reactive response to bodily inflammation, infection, or iron deficiency.',
      commonCauses: [
        'Reactive response to acute or chronic infection/inflammation',
        'Iron deficiency anemia',
        'Recent surgery, tissue trauma, or recovery from blood loss',
        'Essential thrombocythemia (rare primary bone marrow condition)',
      ],
      management: [
        'Stay well-hydrated and address any underlying iron deficiency or localized inflammation under medical guidance.',
      ],
      whenToConsultDoctor: [
        'Platelets persistently above 450,000 cells/uL or accompanied by headaches, burning sensations in hands/feet, or blood clot symptoms.',
      ],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'Platelet Count Test', url: 'https://medlineplus.gov/lab-tests/platelet-count-test/' },
        { name: 'Mayo Clinic', topic: 'Thrombocytosis Symptoms and Causes', url: 'https://www.mayoclinic.org/diseases-conditions/thrombocytosis/symptoms-causes/syc-20378315' },
      ],
    },
  },

  wbc: {
    name: 'White Blood Cell Count (WBC)',
    category: 'Hematology & Immunity',
    unit: 'cells/uL',
    defaultRange: { low: 4000, high: 11000 },
    high: {
      statusLabel: 'Elevated WBC (Leukocytosis)',
      meaning: 'White blood cells are the frontline defense of the immune system. An elevated count typically reflects active immune mobilization in response to an infection, inflammation, or physical stress.',
      commonCauses: [
        'Active bacterial, viral, or fungal infection',
        'Acute physiological stress, vigorous physical exertion, or smoking',
        'Systemic inflammatory condition or tissue healing (e.g. post-surgery/burns)',
        'Corticosteroid medication use',
      ],
      management: [
        'Ensure adequate rest and hydration to support immune recovery.',
        'Address underlying triggers like active infections with your doctor.',
      ],
      whenToConsultDoctor: [
        'WBC elevated alongside fever, chills, localized pain, shortness of breath, or productive cough.',
        'Unexplained persistent leukocytosis without signs of infection.',
      ],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'WBC (White Blood Cell) Count', url: 'https://medlineplus.gov/lab-tests/wbc-count/' },
        { name: 'Mayo Clinic', topic: 'High White Blood Cell Count', url: 'https://www.mayoclinic.org/symptoms/high-white-blood-cell-count/basics/causes/sym-20050611' },
      ],
    },
    low: {
      statusLabel: 'Low WBC (Leukopenia)',
      meaning: 'A white blood cell count below the reference range means fewer immune cells are circulating, which may temporarily reduce defense against infections.',
      commonCauses: [
        'Recent viral infection (suppressing bone marrow production temporarily)',
        'Certain medications (immunosuppressants, antibiotics, anticonvulsants)',
        'Severe nutritional deficiency (Vitamin B12, folate, copper)',
        'Autoimmune or bone marrow conditions',
      ],
      management: [
        'Practice rigorous hand hygiene and food safety to minimize infection risk.',
        'Avoid close contact with individuals who are actively ill while counts recover.',
      ],
      whenToConsultDoctor: [
        'Development of fever (100.4°F/38°C or higher), sore throat, chills, or any signs of infection.',
        'Count persistently below 3,500 cells/uL.',
      ],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'WBC (White Blood Cell) Count', url: 'https://medlineplus.gov/lab-tests/wbc-count/' },
        { name: 'Mayo Clinic', topic: 'Low White Blood Cell Count', url: 'https://www.mayoclinic.org/symptoms/low-white-blood-cell-count/basics/causes/sym-20050615' },
      ],
    },
  },

  tsh: {
    name: 'TSH (Thyroid Stimulating Hormone)',
    category: 'Endocrine & Thyroid',
    unit: 'uIU/mL',
    defaultRange: { low: 0.4, high: 4.5 },
    high: {
      statusLabel: 'Elevated TSH (Possible Underactive Thyroid / Hypothyroidism)',
      meaning: 'TSH is released by the pituitary gland to signal the thyroid to produce thyroid hormones. Elevated TSH indicates that the pituitary is trying harder to stimulate an underactive thyroid.',
      commonCauses: [
        'Primary hypothyroidism (e.g. Hashimoto thyroiditis)',
        'Insufficient thyroid hormone replacement dosage',
        'Iodine deficiency (rare in iodized salt regions) or recovery from acute illness',
      ],
      management: [
        'Ensure balanced dietary nutrition with adequate selenium and zinc.',
        'Avoid excessive raw cruciferous vegetables or unprescribed high-dose iodine supplements which can interfere with thyroid hormone synthesis.',
      ],
      whenToConsultDoctor: [
        'Symptoms of fatigue, unexplained weight gain, cold intolerance, dry skin, constipation, or brain fog.',
        'Follow-up with free T4 testing and clinical endocrinology review.',
      ],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'TSH (Thyroid-Stimulating Hormone) Test', url: 'https://medlineplus.gov/lab-tests/tsh-thyroid-stimulating-hormone-test/' },
        { name: 'American Thyroid Association', topic: 'Hypothyroidism (Underactive Thyroid)', url: 'https://www.thyroid.org/hypothyroidism/' },
        { name: 'Mayo Clinic', topic: 'Hypothyroidism Overview', url: 'https://www.mayoclinic.org/diseases-conditions/hypothyroidism/symptoms-causes/syc-20350284' },
      ],
    },
    low: {
      statusLabel: 'Low TSH (Possible Overactive Thyroid / Hyperthyroidism)',
      meaning: 'A suppressed or low TSH indicates that high circulating thyroid hormone levels have signaled the pituitary gland to reduce stimulation.',
      commonCauses: [
        'Hyperthyroidism (e.g. Graves disease or toxic multinodular goiter)',
        'Excessive thyroid replacement hormone dose',
        'Subacute thyroiditis or pregnancy (first trimester)',
      ],
      management: [
        'Limit excessive stimulants, high caffeine, and stress.',
      ],
      whenToConsultDoctor: [
        'Symptoms of rapid heartbeat, palpitations, heat intolerance, unexplained weight loss, tremors, or insomnia.',
      ],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'TSH Test', url: 'https://medlineplus.gov/lab-tests/tsh-thyroid-stimulating-hormone-test/' },
        { name: 'American Thyroid Association', topic: 'Hyperthyroidism', url: 'https://www.thyroid.org/hyperthyroidism/' },
      ],
    },
  },

  sgpt: {
    name: 'SGPT / ALT (Alanine Aminotransferase)',
    category: 'Hepatic & Liver Function',
    unit: 'U/L',
    defaultRange: { low: 7, high: 45 },
    high: {
      statusLabel: 'Elevated SGPT / ALT (Liver Cell Strain Marker)',
      meaning: 'ALT is an enzyme concentrated primarily in liver cells. When liver cells experience strain, inflammation, or damage, ALT leaks into the bloodstream.',
      commonCauses: [
        'Non-alcoholic fatty liver disease (NAFLD) linked to metabolic factors',
        'Regular or heavy alcohol consumption',
        'Certain medications (statins, acetaminophen overuse, antibiotics, herbal supplements)',
        'Viral hepatitis or intense strenuous muscle exertion',
      ],
      management: [
        'Eliminate or substantially reduce alcohol consumption.',
        'Focus on weight management, low-glycemic Mediterranean nutrition, and regular aerobic exercise.',
        'Review all prescription medications, over-the-counter drugs, and herbal supplements with your physician.',
      ],
      whenToConsultDoctor: [
        'ALT levels greater than 2 to 3 times the upper limit of normal.',
        'Accompanied by jaundice (yellowing of skin/eyes), abdominal pain in the upper right quadrant, dark urine, or severe fatigue.',
      ],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'ALT Blood Test', url: 'https://medlineplus.gov/lab-tests/alt-blood-test/' },
        { name: 'Mayo Clinic', topic: 'Elevated Liver Enzymes', url: 'https://www.mayoclinic.org/symptoms/elevated-liver-enzymes/basics/definition/sym-20050830' },
        { name: 'American Liver Foundation', topic: 'Liver Function Tests', url: 'https://liverfoundation.org/liver-diseases/diagnosing-liver-disease/liver-function-tests/' },
      ],
    },
    low: {
      statusLabel: 'Low SGPT / ALT',
      meaning: 'Low ALT is normal and expected, reflecting healthy liver enzyme containment within hepatocytes.',
      commonCauses: ['Normal baseline physiology', 'Vitamin B6 deficiency (rare)'],
      management: ['Continue a balanced, liver-friendly lifestyle.'],
      whenToConsultDoctor: ['Typically requires no medical consultation.'],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'ALT Blood Test', url: 'https://medlineplus.gov/lab-tests/alt-blood-test/' },
      ],
    },
  },

  sgot: {
    name: 'SGOT / AST (Aspartate Aminotransferase)',
    category: 'Hepatic & Liver Function',
    unit: 'U/L',
    defaultRange: { low: 8, high: 40 },
    high: {
      statusLabel: 'Elevated SGOT / AST',
      meaning: 'AST is an enzyme found in liver tissue as well as cardiac muscle, skeletal muscle, and kidneys. Elevated levels suggest cellular stress in one of these tissues.',
      commonCauses: [
        'Liver inflammation, fatty liver, or alcohol exposure',
        'Vigorous muscular workout or muscle injury',
        'Certain medications or dietary supplements',
      ],
      management: [
        'Limit alcohol intake and avoid strenuous heavy lifting in the 48 hours prior to repeat testing.',
        'Follow a balanced diet supporting hepatic health.',
      ],
      whenToConsultDoctor: [
        'AST elevated alongside elevated ALT, bilirubin, or abdominal discomfort.',
      ],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'AST Blood Test', url: 'https://medlineplus.gov/lab-tests/ast-test/' },
        { name: 'American Liver Foundation', topic: 'Liver Function Tests', url: 'https://liverfoundation.org' },
      ],
    },
    low: {
      statusLabel: 'Low SGOT / AST',
      meaning: 'Normal physiological baseline finding.',
      commonCauses: ['Healthy normal physiology'],
      management: ['Maintain current healthy lifestyle habits.'],
      whenToConsultDoctor: ['No consultation required for low normal baseline.'],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'AST Test', url: 'https://medlineplus.gov/lab-tests/ast-test/' },
      ],
    },
  },

  vitamin_d: {
    name: 'Vitamin D (25-Hydroxy)',
    category: 'Vitamins & Bone Health',
    unit: 'ng/mL',
    defaultRange: { low: 30, high: 100 },
    low: {
      statusLabel: 'Low Vitamin D (Deficiency / Insufficiency Range)',
      meaning: 'Vitamin D is a fat-soluble secosteroid hormone essential for calcium absorption, bone mineralization, neuromuscular function, and immune regulation.',
      commonCauses: [
        'Insufficient sun exposure or consistent use of full sunscreen indoors',
        'Inadequate dietary intake of Vitamin D-rich foods (oily fish, fortified foods)',
        'Malabsorption issues (celiac, Crohn’s, bariatric surgery)',
        'Darker skin pigmentation (requiring more sun exposure for equivalent synthesis)',
      ],
      management: [
        'Engage in safe, moderate sun exposure (15–20 minutes several times per week during daylight).',
        'Consume Vitamin D3 rich foods (salmon, sardines, fortified milk/plant milks, egg yolks).',
        'Discuss appropriate Vitamin D3 supplementation dosage with your doctor or registered dietitian.',
      ],
      whenToConsultDoctor: [
        'Vitamin D level below 20 ng/mL (deficiency range).',
        'Symptoms of bone aches, frequent fractures, muscle weakness, or chronic fatigue.',
      ],
      sources: [
        { name: 'NIH Office of Dietary Supplements', topic: 'Vitamin D Fact Sheet for Health Professionals', url: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/' },
        { name: 'Mayo Clinic', topic: 'Vitamin D Deficiency', url: 'https://www.mayoclinic.org/drugs-supplements-vitamin-d/art-20363792' },
        { name: 'NHS UK', topic: 'Vitamin D Guidelines', url: 'https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-d/' },
      ],
    },
    high: {
      statusLabel: 'Elevated Vitamin D',
      meaning: 'High Vitamin D almost exclusively arises from excessive supplemental intake rather than dietary or sunlight exposure.',
      commonCauses: ['Over-supplementation with high-dose Vitamin D drops or pills over extended periods'],
      management: ['Cease or reduce non-prescribed Vitamin D supplementation.'],
      whenToConsultDoctor: ['Levels >100 ng/mL, or symptoms of nausea, vomiting, frequent urination, or confusion.'],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'Vitamin D Test', url: 'https://medlineplus.gov/lab-tests/vitamin-d-test/' },
      ],
    },
  },

  vitamin_b12: {
    name: 'Vitamin B12 (Cobalamin)',
    category: 'Vitamins & Neurological Health',
    unit: 'pg/mL',
    defaultRange: { low: 200, high: 900 },
    low: {
      statusLabel: 'Low Vitamin B12 (Cobalamin Deficiency)',
      meaning: 'Vitamin B12 is essential for red blood cell formation, cellular energy metabolism, and neurological myelin maintenance.',
      commonCauses: [
        'Strict vegetarian or vegan diet without regular B12 fortification/supplements',
        'Pernicious anemia (lack of intrinsic factor for absorption)',
        'Long-term use of acid-suppressing medications (PPIs, H2 blockers) or Metformin',
        'Gastrointestinal malabsorption (celiac, atrophic gastritis)',
      ],
      management: [
        'Include B12-rich foods (eggs, dairy, fortified nutritional yeast, fortified cereals).',
        'Use an oral cyanocobalamin or methylcobalamin supplement if recommended by your healthcare provider.',
      ],
      whenToConsultDoctor: [
        'B12 below 200 pg/mL, or borderline (200–300 pg/mL) with symptoms.',
        'Neurological symptoms: tingling/numbness in fingers or toes (pins and needles), memory lapses, or unsteadiness.',
      ],
      sources: [
        { name: 'NIH Office of Dietary Supplements', topic: 'Vitamin B12 Fact Sheet', url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/' },
        { name: 'Mayo Clinic', topic: 'Vitamin B12 Deficiency', url: 'https://www.mayoclinic.org/drugs-supplements-vitamin-b12/art-20363663' },
        { name: 'NHS UK', topic: 'B12 and Folate Deficiency Anemia', url: 'https://www.nhs.uk/conditions/vitamin-b12-or-folate-deficiency-anaemia/' },
      ],
    },
    high: {
      statusLabel: 'Elevated Vitamin B12',
      meaning: 'Elevated B12 is commonly caused by high-dose supplementation or occasional liver/kidney alterations.',
      commonCauses: ['High-dose multivitamin/B-complex supplements', 'Liver dysfunction or myeloproliferative states'],
      management: ['Check current supplement labels for excess B12 content.'],
      whenToConsultDoctor: ['Unexplained high levels in the absence of supplementation.'],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'Vitamin B12 Test', url: 'https://medlineplus.gov/lab-tests/vitamin-b12-test/' },
      ],
    },
  },

  uric_acid: {
    name: 'Serum Uric Acid',
    category: 'Renal & Metabolic',
    unit: 'mg/dL',
    defaultRange: { low: 3.0, high: 7.0 },
    high: {
      statusLabel: 'Elevated Uric Acid (Hyperuricemia)',
      meaning: 'Uric acid is a waste product produced from the breakdown of purines found in certain foods and body cells. Elevated levels can crystallize in joints (gout) or kidneys (kidney stones).',
      commonCauses: [
        'Diet rich in purines (red meat, organ meats, shellfish)',
        'High alcohol intake (especially beer) and high-fructose corn syrup',
        'Reduced renal excretion or metabolic syndrome',
        'Dehydration or diuretic medications',
      ],
      management: [
        'Drink plenty of fluids (at least 2–3 liters of water daily) to promote urinary uric acid clearance.',
        'Reduce intake of red meats, organ meats, anchovies, and high-fructose beverages.',
        'Incorporate low-fat dairy, cherries, and Vitamin C which may assist in maintaining healthy uric acid levels.',
      ],
      whenToConsultDoctor: [
        'Sudden, severe pain, swelling, and redness in the big toe, ankle, or knee (gout flare).',
        'History of flank pain or suspected kidney stones.',
      ],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'Uric Acid Test', url: 'https://medlineplus.gov/lab-tests/uric-acid-test/' },
        { name: 'Mayo Clinic', topic: 'High Uric Acid Level (Hyperuricemia)', url: 'https://www.mayoclinic.org/symptoms/high-uric-acid-level/basics/definition/sym-20050607' },
        { name: 'CDC', topic: 'Gout and Uric Acid', url: 'https://www.cdc.gov/arthritis/types/gout.html' },
      ],
    },
    low: {
      statusLabel: 'Low Uric Acid',
      meaning: 'Low uric acid is rare and generally of little clinical significance, often reflecting very low purine intake or medication effects.',
      commonCauses: ['Low-purine diet', 'Uricosuric medications', 'Wilson disease (rare)'],
      management: ['Maintain regular, balanced nutrition.'],
      whenToConsultDoctor: ['Typically no follow-up required unless specifically advised.'],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'Uric Acid Test', url: 'https://medlineplus.gov/lab-tests/uric-acid-test/' },
      ],
    },
  },

  blood_pressure: {
    name: 'Blood Pressure',
    category: 'Cardiovascular',
    unit: 'mmHg',
    defaultRange: { low: 90, high: 120 },
    high: {
      statusLabel: 'Elevated Blood Pressure (Hypertension Range)',
      meaning: 'Blood pressure measures the lateral force exerted by circulating blood against the arterial walls. Sustained elevated pressure places strain on the heart, kidneys, and cerebral vessels.',
      commonCauses: [
        'Excess dietary sodium and processed food intake',
        'Sedentary lifestyle and excess body weight',
        'Chronic psychological stress or acute "white-coat" clinic anxiety',
        'Sleep apnea, alcohol intake, or family history',
      ],
      management: [
        'Adopt the DASH (Dietary Approaches to Stop Hypertension) dietary pattern: rich in vegetables, fruits, whole grains, and potassium while minimizing sodium (<2,300 mg/day).',
        'Engage in 150 minutes of aerobic exercise weekly.',
        'Limit alcohol, maintain restorative sleep, and practice mindfulness/relaxation techniques.',
      ],
      whenToConsultDoctor: [
        'Systolic pressure ≥130 mmHg or diastolic ≥80 mmHg confirmed across multiple resting readings.',
        'Hypertensive emergency: Systolic >180 mmHg or Diastolic >120 mmHg with headache, chest pain, or vision changes requires immediate emergency medical care.',
      ],
      sources: [
        { name: 'American Heart Association', topic: 'Understanding Blood Pressure Readings', url: 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings' },
        { name: 'CDC', topic: 'High Blood Pressure', url: 'https://www.cdc.gov/bloodpressure/' },
        { name: 'NIH MedlinePlus', topic: 'High Blood Pressure', url: 'https://medlineplus.gov/highbloodpressure.html' },
      ],
    },
    low: {
      statusLabel: 'Low Blood Pressure (Hypotension)',
      meaning: 'Blood pressure lower than typical reference ranges may cause transient lightheadedness or dizziness upon standing quickly (orthostatic hypotension).',
      commonCauses: ['Dehydration or low fluid intake', 'Prolonged bed rest or high athletic conditioning', 'Medication side effects (antihypertensives, diuretics)'],
      management: ['Stay well hydrated throughout the day; rise slowly from sitting or lying down positions.'],
      whenToConsultDoctor: ['Dizziness, fainting episodes (syncope), blurred vision, or unsteadiness.'],
      sources: [
        { name: 'American Heart Association', topic: 'Low Blood Pressure - When Blood Pressure Is Too Low', url: 'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/low-blood-pressure-when-blood-pressure-is-too-low' },
      ],
    },
  },

  crp: {
    name: 'C-Reactive Protein (CRP)',
    category: 'Inflammatory Markers',
    unit: 'mg/L',
    defaultRange: { low: 0.1, high: 3.0 },
    high: {
      statusLabel: 'Elevated C-Reactive Protein (Systemic Inflammation Marker)',
      meaning: 'CRP is an acute-phase protein synthesized by the liver whose levels rise in response to systemic inflammation, acute infection, or tissue trauma.',
      commonCauses: [
        'Acute bacterial, viral, or respiratory infection',
        'Chronic inflammatory or autoimmune disorders (rheumatoid arthritis, IBD, lupus)',
        'Cardiovascular arterial inflammation',
        'Recent physical injury or surgery',
      ],
      management: [
        'Adopt an anti-inflammatory nutritional pattern (rich in leafy greens, berries, omega-3 fatty acids, and turmeric/ginger).',
        'Prioritize sufficient restorative sleep and gentle physical movement.',
      ],
      whenToConsultDoctor: [
        'Significantly elevated CRP (>10 mg/L) or elevated with fever, joint swelling, or chest discomfort.',
      ],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'C-Reactive Protein (CRP) Test', url: 'https://medlineplus.gov/lab-tests/c-reactive-protein-crp-test/' },
        { name: 'Mayo Clinic', topic: 'C-reactive protein test', url: 'https://www.mayoclinic.org/tests-procedures/c-reactive-protein-test/about/pac-20385228' },
        { name: 'American Heart Association', topic: 'Inflammation and Heart Disease', url: 'https://www.heart.org/en/health-topics/consumer-healthcare/what-is-cardiovascular-disease/inflammation-and-heart-disease' },
      ],
    },
    low: {
      statusLabel: 'Low / Normal CRP',
      meaning: 'Indicates baseline low systemic inflammation.',
      commonCauses: ['Healthy baseline'],
      management: ['Continue heart-healthy and anti-inflammatory habits.'],
      whenToConsultDoctor: ['No follow-up needed for normal baseline.'],
      sources: [
        { name: 'NIH MedlinePlus', topic: 'CRP Test', url: 'https://medlineplus.gov/lab-tests/c-reactive-protein-crp-test/' },
      ],
    },
  },
};

/**
 * Generic Fallback Generator for any biomarker with High/Low status
 * when not explicitly covered by detailed custom profiles above.
 */
export function getGenericBiomarkerInsight(biomarkerName, status, value, unit, refRange) {
  const isHigh = status === 'high';
  const rangeStr = refRange
    ? refRange.low !== undefined && refRange.high !== undefined
      ? `${refRange.low} – ${refRange.high} ${unit}`
      : refRange.rawText || ''
    : 'Standard Lab Reference Interval';

  return {
    statusLabel: isHigh ? `Elevated ${biomarkerName}` : `Low ${biomarkerName}`,
    meaning: `${biomarkerName} was measured at ${value} ${unit}, which is ${isHigh ? 'above' : 'below'} the report's reference interval (${rangeStr}). Deviations from the standard reference interval reflect physiological variations, lifestyle influences, or metabolic factors.`,
    commonCauses: isHigh
      ? [
          'Acute physiological stress, temporary dehydration, or dietary factors',
          'Metabolic adjustments or medication interactions',
          'Organ-specific cellular activation or delayed excretion',
        ]
      : [
          'Nutritional or dietary insufficiency',
          'Temporary dilution or decreased synthesis',
          'Metabolic utilization variations or medication effects',
        ],
    management: [
      'Maintain adequate hydration and a diverse, nutrient-dense diet.',
      'Document any new symptoms, supplements, or recent lifestyle changes.',
      'Plan a routine follow-up lab panel with your doctor to assess stability over time.',
    ],
    whenToConsultDoctor: [
      `Discuss this result with your healthcare provider to correlate with your clinical history, symptoms, and repeat verification.`,
    ],
    sources: [
      { name: 'NIH MedlinePlus', topic: 'Understanding Lab Test Results', url: 'https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/' },
      { name: 'Mayo Clinic', topic: 'Medical Tests & Diagnostics', url: 'https://www.mayoclinic.org/tests-procedures' },
    ],
  };
}

/**
 * Normal Insight for values within healthy reference range
 */
export function getNormalBiomarkerInsight(biomarkerName, value, unit, refRange) {
  const rangeStr = refRange
    ? refRange.low !== undefined && refRange.high !== undefined
      ? `${refRange.low} – ${refRange.high} ${unit}`
      : refRange.rawText || ''
    : 'Standard Lab Reference Interval';

  return {
    statusLabel: `Normal ${biomarkerName} (Within Reference Range)`,
    meaning: `${biomarkerName} is measured at ${value} ${unit}, which falls comfortably within the expected reference range (${rangeStr}). This indicates optimal physiological balance for this parameter.`,
    commonCauses: ['Healthy baseline physiology', 'Balanced nutrition and hydration'],
    management: ['Continue your current lifestyle, balanced diet, and routine preventative health screenings.'],
    whenToConsultDoctor: ['Routine periodic checkups as recommended by your physician.'],
    sources: [
      { name: 'NIH MedlinePlus', topic: 'Lab Test Information', url: 'https://medlineplus.gov/lab-tests/' },
    ],
  };
}
