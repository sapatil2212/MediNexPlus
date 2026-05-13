# 🚀 Quick Start Guide - Department Configuration Module

## ✅ Implementation Complete!

The Department Configuration Module has been successfully implemented with:
- ✅ Database schema migrated
- ✅ Backend services created
- ✅ API routes configured
- ✅ ServicePanel integrated
- ✅ TreatmentPlanPanel created
- ✅ Permission system ready

---

## 📋 Step-by-Step Setup

### 1. Start the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

### 2. Login as Hospital Admin

Navigate to: `http://localhost:3000/login`

Use your hospital admin credentials.

### 3. Seed Permissions (First Time Only)

After logging in, open your browser console and run:

```javascript
fetch('/api/permissions/seed', {
  method: 'POST',
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

This will:
- Create 30+ default permissions
- Assign permissions to all roles
- Initialize the RBAC system

**Expected Response:**
```json
{
  "success": true,
  "message": "Permissions seeded successfully",
  "data": {
    "permissionsCreated": 30,
    "rolesInitialized": 6
  }
}
```

### 4. Access the Configuration Page

Navigate to: `http://localhost:3000/hospitaladmin/configure?tab=services`

You should see the **Services & Packages** tab!

---

## 🎯 Test the Complete Flow

### Test 1: Create a Service Package

1. Go to **Configure → Services & Packages**
2. Click **"+ Add Service/Package"**
3. Fill in the form:
   ```
   Service Name: PRP Hair Treatment (6 Sessions)
   Service Code: PRP-HAIR-6
   Category: PACKAGE
   Number of Sessions: 6
   Total Package Price: 30000
   Duration: 45 minutes
   Validity: 180 days
   ✓ Requires Pharmacy
   ```
4. Click **Create**
5. Verify the service appears in the table

### Test 2: View Treatment Plans

1. Navigate to: `http://localhost:3000/hospitaladmin/configure?tab=treatments`
   (You'll need to add this tab - see below)
2. Or use the TreatmentPlanPanel component directly

### Test 3: Check Permissions

Open browser console:
```javascript
// Check your permissions
fetch('/api/permissions/user/YOUR_USER_ID', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

---

## 🔧 Optional: Add Treatment Plans Tab

To add a Treatment Plans tab to the configure page:

**File:** `src/app/hospitaladmin/configure/page.tsx`

1. Import TreatmentPlanPanel:
```typescript
import TreatmentPlanPanel from "@/components/TreatmentPlanPanel";
```

2. Add to Tab type:
```typescript
type Tab = "settings"|"departments"|"subdepts"|"services"|"treatments"|"doctors"|"staff"|"wards"|"billing"|"inventory";
```

3. Add to TABS array:
```typescript
{id:"treatments",label:"Treatment Plans",icon:Activity},
```

4. Add to tab rendering:
```typescript
{tab==="treatments"&&<TreatmentPlanPanel/>}
```

---

## 📊 Available Features

### ✅ Services & Packages
- Create multi-session packages (PRP, Laser, etc.)
- Auto-calculate price per session
- Set pharmacy/lab requirements
- Link to departments/sub-departments
- Set validity periods

### ✅ Treatment Plans
- Track patient treatment progress
- Monitor session completion
- View billing status
- See payment details

### ✅ Permission System
- 30+ granular permissions
- Role-based access control
- User-level permission overrides
- Department/SubDepartment access control

---

## 🔐 Permission Codes Reference

### Department Management
- `DEPT_VIEW` - View departments
- `DEPT_CREATE` - Create departments
- `DEPT_UPDATE` - Edit departments
- `DEPT_DELETE` - Delete departments
- `SUBDEPT_MANAGE` - Manage sub-departments
- `PROCEDURE_MANAGE` - Manage procedures/services

### Patient & Clinical
- `PATIENT_VIEW` - View patients
- `PATIENT_CREATE` - Register patients
- `PATIENT_UPDATE` - Edit patients
- `PATIENT_HISTORY` - View medical history
- `RX_CREATE` - Write prescriptions
- `PROCEDURE_PERFORM` - Perform procedures

### Billing & Finance
- `BILL_VIEW` - View bills
- `BILL_CREATE` - Generate bills
- `PAYMENT_PROCESS` - Collect payments
- `FINANCE_REPORTS` - View financial reports

---

## 🎨 UI Components Available

### ServicePanel
**Location:** `src/components/ServicePanel.tsx`

Features:
- Search and filter services
- Create/edit/delete packages
- Session count configuration
- Price per session auto-calculation
- Pharmacy/Lab requirement toggles

### TreatmentPlanPanel
**Location:** `src/components/TreatmentPlanPanel.tsx`

Features:
- View all treatment plans
- Filter by status
- Search by patient
- View session progress
- See billing details
- Session-by-session breakdown

---

## 🔄 Integration with Doctor Dashboard

To add service selection to doctor consultation flow:

**File:** `src/app/doctor/dashboard/page.tsx`

Add service selection dropdown in the ConsultModal:

```typescript
// Fetch services
const [services, setServices] = useState([]);

useEffect(() => {
  fetch('/api/config/services?isActive=true')
    .then(r => r.json())
    .then(d => setServices(d.data?.services || []));
}, []);

// In the form
<div className="field">
  <label>Select Service/Package</label>
  <select onChange={(e) => handleServiceSelect(e.target.value)}>
    <option value="">Select Service</option>
    {services.map(s => (
      <option key={s.id} value={s.id}>
        {s.name} - ₹{s.price} ({s.sessionCount} sessions)
      </option>
    ))}
  </select>
</div>

// Handler
const handleServiceSelect = async (serviceId) => {
  if (!serviceId) return;
  
  const response = await fetch('/api/treatment-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      patientId: currentPatient.id,
      serviceId,
      doctorId: doctor.id,
    })
  });
  
  if (response.ok) {
    alert('Treatment plan created successfully!');
  }
};
```

---

## 📁 File Structure

```
backend/
├── validations/
│   ├── service.validation.ts
│   ├── treatment.validation.ts
│   └── permission.validation.ts
├── repositories/
│   ├── service.repo.ts
│   ├── treatment.repo.ts
│   └── permission.repo.ts
├── services/
│   ├── service.service.ts
│   ├── treatment.service.ts
│   └── permission.service.ts
└── middlewares/
    └── permission.middleware.ts

src/
├── app/api/
│   ├── config/services/
│   ├── treatment-plans/
│   └── permissions/
└── components/
    ├── ServicePanel.tsx
    └── TreatmentPlanPanel.tsx

prisma/
└── migrations/
    └── 20260325080000_enhanced_department_config/
```

---

## 🐛 Troubleshooting

### Issue: "Permission denied" errors
**Solution:**
1. Make sure you've seeded permissions (Step 3 above)
2. Check your user role in the database
3. Verify you're logged in as HOSPITAL_ADMIN

### Issue: Services not loading
**Solution:**
1. Check browser console for errors
2. Verify API endpoint: `/api/config/services`
3. Check network tab for response

### Issue: TypeScript errors
**Solution:**
```bash
npx prisma generate
# Restart TypeScript server in VS Code
```

---

## 📚 API Endpoints

### Services
```
GET    /api/config/services              # List services
POST   /api/config/services              # Create service
GET    /api/config/services/[id]         # Get service
PUT    /api/config/services/[id]         # Update service
DELETE /api/config/services/[id]         # Delete service
```

### Treatment Plans
```
GET    /api/treatment-plans              # List plans
POST   /api/treatment-plans              # Create plan
GET    /api/treatment-plans/[id]         # Get plan details
PUT    /api/treatment-plans/[id]         # Update plan
DELETE /api/treatment-plans/[id]         # Delete plan
```

### Permissions
```
GET    /api/permissions                  # List all permissions
GET    /api/permissions/user/[userId]    # User's permissions
POST   /api/permissions/seed             # Seed permissions
```

---

## ✨ What's Next?

1. ✅ **Test the Services tab** - Create a few service packages
2. ✅ **Seed permissions** - Run the seed endpoint
3. 🔄 **Integrate with doctor flow** - Add service selection
4. 🔄 **Build dynamic dashboards** - Role-based metrics
5. 🔄 **Add permission management UI** - Admin panel for permissions

---

## 🎯 Success Criteria

You've successfully set up the module when:
- ✅ You can create service packages
- ✅ Services appear in the table
- ✅ Permissions are seeded
- ✅ No console errors
- ✅ API endpoints respond correctly

---

## 📞 Need Help?

Check the comprehensive documentation:
- `DEPARTMENT_CONFIG_IMPLEMENTATION.md` - Full technical guide
- `IMPLEMENTATION_SUMMARY.md` - Quick reference

---

**🎉 Congratulations! Your Department Configuration Module is ready to use!**

Navigate to: `http://localhost:3000/hospitaladmin/configure?tab=services`
