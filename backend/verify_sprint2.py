import requests
import sys

BASE_URL = "http://127.0.0.1:5001/api"

def verify():
    print("Starting Sprint 2 API verification tests...")
    
    # 1. Login as Admin to get token
    print("\n[TEST 1] Logging in as Admin...")
    login_url = f"{BASE_URL}/auth/login"
    payload = {
        "email": "admin@ecosphere.com",
        "password": "admin123"
    }
    
    res = requests.post(login_url, json=payload)
    if res.status_code != 200:
        print(f"FAILED: Login returned status code {res.status_code}")
        print(res.text)
        sys.exit(1)
        
    token = res.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    print("SUCCESS: Token obtained successfully.")
    
    # 2. Get Diversity Stats
    print("\n[TEST 2] Fetching diversity stats...")
    stats_url = f"{BASE_URL}/social/diversity-stats"
    res = requests.get(stats_url, headers=headers)
    if res.status_code != 200:
        print(f"FAILED: diversity-stats returned status code {res.status_code}")
        print("Response:", res.text)
        sys.exit(1)
        
    stats_data = res.json()
    print("SUCCESS: diversity-stats data retrieved.")
    print(f"Total Count: {stats_data.get('total_count')}")
    print(f"Gender Ratio: {stats_data.get('gender_ratio')}")
    print(f"Age Distribution Brackets count: {len(stats_data.get('age_distribution'))}")
    
    # 3. Get Settings
    print("\n[TEST 3] Fetching system weights settings...")
    settings_url = f"{BASE_URL}/settings"
    res = requests.get(settings_url, headers=headers)
    if res.status_code != 200:
        print(f"FAILED: GET settings returned status code {res.status_code}")
        sys.exit(1)
        
    settings_data = res.json()
    print("SUCCESS: settings retrieved.")
    print(f"Settings: {settings_data}")
    
    # 4. Save Settings with new weights
    print("\n[TEST 4] Updating system weights (E=50, S=25, G=25)...")
    update_payload = {
        "environmental_weight": 50,
        "social_weight": 25,
        "governance_weight": 25,
        "evidence_required": True,
        "auto_carbon": True,
        "auto_badge": True
    }
    res = requests.put(settings_url, json=update_payload, headers=headers)
    if res.status_code != 200:
        print(f"FAILED: PUT settings returned status code {res.status_code}")
        print(res.text)
        sys.exit(1)
        
    updated_settings = res.json()
    print(f"SUCCESS: settings updated. New weights: E={updated_settings.get('environmental_weight')}, S={updated_settings.get('social_weight')}, G={updated_settings.get('governance_weight')}")
    
    # 5. Get Department Scores
    print("\n[TEST 5] Fetching department ESG scores...")
    scores_url = f"{BASE_URL}/department-scores"
    res = requests.get(scores_url, headers=headers)
    if res.status_code != 200:
        print(f"FAILED: GET department-scores returned status code {res.status_code}")
        sys.exit(1)
        
    scores_list = res.json()
    print(f"SUCCESS: {len(scores_list)} department scorecards retrieved.")
    for score in scores_list:
        print(f"- {score.get('department_name')}: Rank #{score.get('ranking')} (Score: {score.get('total_score')} | E: {score.get('environmental_score')}, S: {score.get('social_score')}, G: {score.get('governance_score')})")
        
    # 6. Recalculate Scores
    print("\n[TEST 6] Triggering manual score recalculation...")
    recalc_url = f"{BASE_URL}/department-scores/recalculate"
    res = requests.post(recalc_url, headers=headers)
    if res.status_code != 200:
        print(f"FAILED: POST recalculate returned status code {res.status_code}")
        sys.exit(1)
        
    print("SUCCESS: Score recalculation completed successfully.")
    print("\nALL SPRINT 2 VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    verify()
