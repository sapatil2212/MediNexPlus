# Voice Assistant Troubleshooting Guide

## Issue: Voice Assistant Not Working

The voice assistant has been implemented with Google Gemini 1.5 Flash's multimodal audio processing capabilities. If you're experiencing issues, follow this guide:

---

## Quick Diagnostics

### 1. **Check Browser Console**
Open browser DevTools (F12) and check for errors when clicking "Voice Rx" button:
- Look for microphone permission errors
- Check for API call failures
- Verify audio recording errors

### 2. **Test Microphone Access**
- Browser should prompt for microphone permission
- Grant permission when asked
- Check browser settings if permission was previously denied

### 3. **Verify API Key**
The Gemini API key is already configured in `.env`:
```env
GEMINI_API_KEY="AIzaSyBT5GWGKsbb0-DiaSlDWe5en4q6yG4s2eo"
```

---

## Common Issues & Solutions

### Issue 1: "Microphone Access Denied"
**Symptoms**: Error message appears immediately when starting recording

**Solutions**:
1. **Chrome/Edge**: 
   - Click the lock icon in address bar
   - Set "Microphone" to "Allow"
   - Refresh the page

2. **Firefox**:
   - Click the microphone icon in address bar
   - Select "Allow" and check "Remember this decision"

3. **System Settings**:
   - Windows: Settings → Privacy → Microphone → Allow apps
   - Mac: System Preferences → Security & Privacy → Microphone

---

### Issue 2: "Failed to Process Recording"
**Symptoms**: Recording completes but shows error during processing

**Possible Causes**:
1. **Network Issues**: Check internet connection
2. **API Rate Limit**: Gemini API may have rate limits
3. **Audio Format**: Browser may use unsupported format

**Solutions**:
```javascript
// Check browser console for specific error
// Look for messages like:
// - "Failed to process recording"
// - "AI transcription failed"
// - Network errors (CORS, timeout)
```

**Fix for Audio Format Issues**:
The component uses WebM format by default. If your browser doesn't support it:
1. Check `VoicePrescriptionRecorder.tsx` line 88
2. Verify MediaRecorder mimeType support
3. Browser compatibility: Chrome/Edge (WebM), Safari (MP4)

---

### Issue 3: "No Audio Detected"
**Symptoms**: Recording starts but audio level meter shows no activity

**Solutions**:
1. **Check Microphone**:
   - Test microphone in another app
   - Ensure correct microphone is selected
   - Check volume levels

2. **Browser Compatibility**:
   - Use Chrome or Edge (recommended)
   - Firefox may have issues with some audio formats
   - Safari requires MP4 format

3. **Audio Input**:
   - Speak clearly and at normal volume
   - Position microphone appropriately
   - Minimize background noise

---

### Issue 4: "Processing Takes Too Long"
**Symptoms**: Stuck on "Processing Recording..." for >30 seconds

**Causes**:
- Large audio file (>5 minutes)
- Slow internet connection
- Gemini API server issues

**Solutions**:
1. Keep recordings under 3-5 minutes
2. Check network speed
3. Try again in a few minutes
4. Check Gemini API status: https://status.cloud.google.com/

---

### Issue 5: "Incomplete Data Extraction"
**Symptoms**: Some fields not populated after transcription

**This is Normal**: AI may not extract all data if:
- Information wasn't mentioned in conversation
- Audio quality was poor
- Medical terms were unclear

**Solutions**:
1. Speak clearly during recording
2. Explicitly mention:
   - Vital signs (BP, pulse, etc.)
   - Medication names and dosages
   - Lab test names
   - Diagnosis
3. Manually add missing information after AI processing

---

## Testing the Voice Assistant

### Test Recording Script
Use this sample conversation to test:

```
Doctor: "Good morning, how are you feeling today?"
Patient: "I have a severe headache and fever for the past 3 days."
Doctor: "Let me check your vitals. Blood pressure is 120 over 80, pulse is 85, temperature is 101 degrees Fahrenheit."
Patient: "I also feel very weak and tired."
Doctor: "Based on your symptoms, this appears to be a viral fever. I'm prescribing Paracetamol 500mg, take it twice daily after food for 5 days. Also take plenty of rest and drink lots of water."
Patient: "Should I get any tests done?"
Doctor: "Yes, let's do a complete blood count. It's routine, we'll check for any infection. Come back for a follow-up in 5 days if the fever doesn't subside."
```

**Expected Output**:
- ✅ Transcription: Full conversation
- ✅ Chief Complaint: "Severe headache and fever for 3 days"
- ✅ Diagnosis: "Viral fever"
- ✅ Vitals: BP 120/80, Pulse 85, Temp 101°F
- ✅ Medications: Paracetamol 500mg, BD, 5 days, Oral, After food
- ✅ Lab Tests: Complete Blood Count (CBC)
- ✅ Advice: Rest, hydration
- ✅ Follow-up: 5 days

---

## Advanced Debugging

### Check API Route
Test the API endpoint directly:

```bash
# In browser console or Postman
POST http://localhost:3000/api/prescriptions/voice-transcribe

Headers:
Content-Type: application/json

Body:
{
  "prescriptionId": "your-prescription-id",
  "audioBase64": "base64-encoded-audio-data"
}
```

### Check Server Logs
Monitor the dev server console for errors:
```bash
# Look for:
- "Voice transcription error:"
- "AI transcription failed:"
- Gemini API errors
- JSON parsing errors
```

### Verify Gemini API
Test Gemini API key separately:
```javascript
// Test in Node.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Test text generation
const result = await model.generateContent("Hello");
console.log(result.response.text());
```

---

## Browser Compatibility

| Browser | WebM Support | MP4 Support | Recommended |
|---------|-------------|-------------|-------------|
| Chrome  | ✅ Yes      | ✅ Yes      | ✅ **Best** |
| Edge    | ✅ Yes      | ✅ Yes      | ✅ **Best** |
| Firefox | ✅ Yes      | ⚠️ Limited  | ⚠️ OK       |
| Safari  | ❌ No       | ✅ Yes      | ⚠️ Needs MP4|

---

## Performance Optimization

### If Processing is Slow:
1. **Reduce Recording Length**: Keep under 3 minutes
2. **Better Internet**: Use wired connection if possible
3. **Off-Peak Hours**: API may be faster during off-peak times

### If Audio Quality is Poor:
1. Use external microphone (better than laptop mic)
2. Record in quiet environment
3. Speak clearly and at moderate pace

---

## Still Not Working?

### Collect Debug Information:
1. **Browser**: Chrome/Edge/Firefox version
2. **Error Message**: Exact error from console
3. **Recording Length**: How long was the audio
4. **Network**: Speed test results
5. **Steps**: What exactly did you do

### Check These Files:
- `backend/services/voice-prescription.service.ts` - AI processing logic
- `src/components/VoicePrescriptionRecorder.tsx` - Recording component
- `src/app/api/prescriptions/voice-transcribe/route.ts` - API endpoint

### Fallback Option:
If voice assistant continues to fail, use the **AI Assist** button instead:
1. Manually type chief complaint
2. Click "AI Assist" button
3. Review and adjust AI suggestions

---

## Contact Support

If issues persist after trying all solutions:
1. Check GitHub issues
2. Review Gemini API documentation
3. Verify API quota and billing
4. Test with different audio samples

---

**Last Updated**: March 26, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
