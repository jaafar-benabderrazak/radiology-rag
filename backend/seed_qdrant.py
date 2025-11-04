"""
Seed Qdrant Vector Database with Sample Radiology Cases
This populates the database with realistic radiology case examples for RAG retrieval
"""
from vector_service import vector_service

# Sample radiology cases organized by category
SAMPLE_CASES = [
    # CT Cases
    {
        "case_id": "CT001",
        "text": "Patient presents with acute onset chest pain and shortness of breath. CT pulmonary angiography demonstrates filling defects in the right lower lobe segmental arteries consistent with acute pulmonary embolism. No right heart strain. Lungs are otherwise clear.",
        "category": "CT",
        "modality": "CTPA",
        "diagnosis": "Pulmonary Embolism"
    },
    {
        "case_id": "CT002",
        "text": "45-year-old with acute neurological deficit. Non-contrast CT head shows loss of gray-white differentiation in the left MCA territory with hyperdense left MCA sign. No hemorrhage. Early ischemic changes suggestive of acute ischemic stroke.",
        "category": "CT",
        "modality": "CT Head",
        "diagnosis": "Acute Ischemic Stroke"
    },
    {
        "case_id": "CT003",
        "text": "Abdominal pain, fever, elevated WBC. CT abdomen/pelvis shows dilated appendix measuring 12mm with periappendiceal fat stranding and a small amount of free fluid. Findings consistent with acute appendicitis.",
        "category": "CT",
        "modality": "CT Abdomen",
        "diagnosis": "Acute Appendicitis"
    },
    {
        "case_id": "CT004",
        "text": "Follow-up of incidental pulmonary nodule. CT chest demonstrates a 6mm solid nodule in the right upper lobe, unchanged from prior study 6 months ago. No new nodules. No lymphadenopathy. Benign appearance, stable.",
        "category": "CT",
        "modality": "CT Chest",
        "diagnosis": "Stable Pulmonary Nodule"
    },
    {
        "case_id": "CT005",
        "text": "Trauma patient, high-speed motor vehicle collision. CT head shows acute subdural hematoma along the right convexity with 8mm midline shift. Mass effect on right lateral ventricle. Requires immediate neurosurgical evaluation.",
        "category": "CT",
        "modality": "CT Head",
        "diagnosis": "Acute Subdural Hematoma"
    },
    {
        "case_id": "CT006",
        "text": "Chronic smoker with hemoptysis. CT chest reveals irregular spiculated mass in right upper lobe measuring 3.2cm with associated mediastinal lymphadenopathy. Findings highly suspicious for primary lung malignancy.",
        "category": "CT",
        "modality": "CT Chest",
        "diagnosis": "Suspected Lung Cancer"
    },

    # MRI Cases
    {
        "case_id": "MRI001",
        "text": "Low back pain radiating to left leg. MRI lumbar spine shows large left paracentral disc herniation at L5-S1 with compression of the left S1 nerve root. Disc desiccation and loss of height at L5-S1.",
        "category": "IRM",
        "modality": "MRI Spine",
        "diagnosis": "Disc Herniation with Radiculopathy"
    },
    {
        "case_id": "MRI002",
        "text": "Progressive memory loss and confusion. MRI brain demonstrates diffuse cerebral and hippocampal volume loss disproportionate to age. Prominent sulci and ventricles. White matter hyperintensities. Findings consistent with Alzheimer's dementia.",
        "category": "IRM",
        "modality": "MRI Brain",
        "diagnosis": "Alzheimer's Dementia"
    },
    {
        "case_id": "MRI003",
        "text": "Knee pain and locking sensation. MRI knee shows oblique tear of the posterior horn of the medial meniscus. Intact ACL and PCL. Mild joint effusion. No bone marrow edema.",
        "category": "IRM",
        "modality": "MRI Knee",
        "diagnosis": "Meniscal Tear"
    },
    {
        "case_id": "MRI004",
        "text": "Young patient with multiple neurological episodes. MRI brain reveals multiple periventricular and juxtacortical T2/FLAIR hyperintense lesions, some with restricted diffusion. Findings suggestive of demyelinating disease, consistent with multiple sclerosis.",
        "category": "IRM",
        "modality": "MRI Brain",
        "diagnosis": "Multiple Sclerosis"
    },
    {
        "case_id": "MRI005",
        "text": "Shoulder pain and weakness. MRI shoulder demonstrates full-thickness tear of the supraspinatus tendon with retraction to the level of the humeral head. Mild muscle atrophy. Intact subscapularis and infraspinatus.",
        "category": "IRM",
        "modality": "MRI Shoulder",
        "diagnosis": "Rotator Cuff Tear"
    },

    # X-Ray Cases
    {
        "case_id": "XR001",
        "text": "Productive cough and fever. Chest X-ray shows right lower lobe consolidation with air bronchograms. No pleural effusion. Findings consistent with community-acquired pneumonia.",
        "category": "X-Ray",
        "modality": "Chest X-ray",
        "diagnosis": "Pneumonia"
    },
    {
        "case_id": "XR002",
        "text": "Fall on outstretched hand. Wrist X-ray demonstrates dorsally angulated fracture of the distal radius with dorsal displacement of the distal fragment. Classic Colles fracture. No intra-articular extension.",
        "category": "X-Ray",
        "modality": "Wrist X-ray",
        "diagnosis": "Colles Fracture"
    },
    {
        "case_id": "XR003",
        "text": "Chronic smoker, routine screening. Chest X-ray shows hyperinflated lungs with flattened diaphragms and increased AP diameter. Paucity of peripheral vascular markings. Findings consistent with COPD/emphysema.",
        "category": "X-Ray",
        "modality": "Chest X-ray",
        "diagnosis": "COPD/Emphysema"
    },
    {
        "case_id": "XR004",
        "text": "Abdominal pain and distension. Abdominal X-ray shows multiple dilated loops of small bowel with air-fluid levels. Paucity of colonic gas. Findings suggestive of small bowel obstruction.",
        "category": "X-Ray",
        "modality": "Abdominal X-ray",
        "diagnosis": "Small Bowel Obstruction"
    },
    {
        "case_id": "XR005",
        "text": "Elderly patient with hip pain after fall. Pelvis X-ray demonstrates displaced fracture of the left femoral neck. No other acute fractures identified. Urgent orthopedic consultation required.",
        "category": "X-Ray",
        "modality": "Pelvis X-ray",
        "diagnosis": "Hip Fracture"
    },
    {
        "case_id": "XR006",
        "text": "Routine chest X-ray. Cardiomediastinal silhouette is within normal limits. Lungs are clear bilaterally. No pleural effusion or pneumothorax. No acute cardiopulmonary abnormality.",
        "category": "X-Ray",
        "modality": "Chest X-ray",
        "diagnosis": "Normal Chest X-ray"
    },

    # Ultrasound Cases
    {
        "case_id": "US001",
        "text": "Right upper quadrant pain. Ultrasound abdomen shows multiple echogenic foci within the gallbladder with posterior acoustic shadowing, consistent with gallstones. Gallbladder wall measures 5mm. No pericholecystic fluid.",
        "category": "Ultrasound",
        "modality": "Abdominal Ultrasound",
        "diagnosis": "Cholelithiasis"
    },
    {
        "case_id": "US002",
        "text": "First trimester pregnancy evaluation. Transvaginal ultrasound demonstrates intrauterine gestational sac with visible fetal pole and cardiac activity. Crown-rump length corresponds to 8 weeks gestation. Normal early pregnancy.",
        "category": "Ultrasound",
        "modality": "OB Ultrasound",
        "diagnosis": "Normal Early Pregnancy"
    },
    {
        "case_id": "US003",
        "text": "Painful swollen leg. Venous Doppler ultrasound shows non-compressible left common femoral and femoral veins with echogenic thrombus. No flow on color Doppler. Findings diagnostic of acute deep vein thrombosis.",
        "category": "Ultrasound",
        "modality": "Doppler Ultrasound",
        "diagnosis": "Deep Vein Thrombosis"
    },
    {
        "case_id": "US004",
        "text": "Elevated liver enzymes. Liver ultrasound demonstrates diffusely increased hepatic echogenicity consistent with fatty infiltration. Normal liver size and contour. Portal vein patent. Findings consistent with hepatic steatosis.",
        "category": "Ultrasound",
        "modality": "Abdominal Ultrasound",
        "diagnosis": "Hepatic Steatosis (Fatty Liver)"
    },
    {
        "case_id": "US005",
        "text": "Palpable thyroid nodule. Thyroid ultrasound shows 2.1cm hypoechoic solid nodule in the right lobe with irregular margins and microcalcifications. TI-RADS 5, highly suspicious for malignancy. Biopsy recommended.",
        "category": "Ultrasound",
        "modality": "Thyroid Ultrasound",
        "diagnosis": "Suspicious Thyroid Nodule"
    },

    # Additional Complex Cases
    {
        "case_id": "CT007",
        "text": "Sudden severe headache. CT head shows high-attenuation blood in the basal cisterns and sylvian fissures. No intraventricular extension. Findings consistent with subarachnoid hemorrhage. CTA recommended to evaluate for aneurysm.",
        "category": "CT",
        "modality": "CT Head",
        "diagnosis": "Subarachnoid Hemorrhage"
    },
    {
        "case_id": "CT008",
        "text": "Suspected aortic dissection. CT angiography shows intimal flap in the ascending aorta extending into the arch and descending thoracic aorta. Stanford Type A dissection. Emergent surgical consultation required.",
        "category": "CT",
        "modality": "CTA Chest",
        "diagnosis": "Aortic Dissection Type A"
    },
    {
        "case_id": "MRI006",
        "text": "Difficulty swallowing. MRI brain and brainstem shows irregular enhancing mass at the pontomedullary junction with surrounding edema. Mass effect on fourth ventricle. Findings concerning for brainstem glioma.",
        "category": "IRM",
        "modality": "MRI Brain",
        "diagnosis": "Brainstem Tumor"
    },
    {
        "case_id": "XR007",
        "text": "Chronic cough and weight loss. Chest X-ray demonstrates right hilar mass with mediastinal widening. Associated right upper lobe collapse. Highly concerning for primary lung malignancy with mediastinal involvement.",
        "category": "X-Ray",
        "modality": "Chest X-ray",
        "diagnosis": "Lung Mass with Collapse"
    },
]

def seed_database():
    """Populate Qdrant with sample radiology cases"""
    print("=" * 70)
    print("Seeding Qdrant Vector Database with Sample Radiology Cases")
    print("=" * 70)

    if not vector_service.client:
        print("\n❌ Error: Qdrant client not initialized")
        print("Make sure Qdrant container is running and accessible")
        return False

    print(f"\nTarget collection: {vector_service.collection_name}")
    print(f"Total cases to add: {len(SAMPLE_CASES)}\n")

    success_count = 0
    fail_count = 0

    for case in SAMPLE_CASES:
        case_id = case["case_id"]
        text = case["text"]
        metadata = {k: v for k, v in case.items() if k not in ["case_id", "text"]}

        print(f"Adding {case_id} ({case['diagnosis']})...", end=" ")

        success = vector_service.add_case(
            case_id=case_id,
            text=text,
            metadata=metadata
        )

        if success:
            print("✓")
            success_count += 1
        else:
            print("✗")
            fail_count += 1

    print("\n" + "=" * 70)
    print(f"✅ Seeding Complete!")
    print(f"  Successfully added: {success_count} cases")
    if fail_count > 0:
        print(f"  Failed: {fail_count} cases")
    print("=" * 70)

    # Show summary by category
    print("\nCases by Category:")
    categories = {}
    for case in SAMPLE_CASES:
        cat = case["category"]
        categories[cat] = categories.get(cat, 0) + 1

    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count} cases")

    print("\n💡 Tip: RAG will now retrieve similar cases when generating reports!")
    print("   Use 'auto' template mode to enable RAG-enhanced generation.\n")

    return success_count > 0

if __name__ == "__main__":
    try:
        success = seed_database()
        if not success:
            print("\n⚠ Warning: No cases were added to the database")
            print("Check Qdrant connection and try again")
            exit(1)
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
