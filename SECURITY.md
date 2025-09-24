# Security Guidelines

## Overview

This document outlines the security measures implemented in the RAI AI Farming Mobile App to protect sensitive information and prevent secret leakage.

## 🔒 Security Measures Implemented

### 1. Server-Side Proxies

The mobile app **never** makes direct calls to external APIs with sensitive keys. All external API calls are proxied through our backend server:

- **Geocoding**: `GET /api/geocode?query=...` (Google → Mapbox fallback)
- **Weather**: `GET /api/weather?lat=..&lng=..` (MeteoSource → OWM fallback)  
- **Disease Detection**: `POST /api/scan` (AI service)
- **Market Prices**: `GET /api/prices?...` (Price data service)

### 2. Environment Configuration

- **`.env.example`**: Template with placeholder values
- **`.env`**: Local development (gitignored)
- **Production**: Environment variables injected via CI/CD

### 3. Secret Scanning

- **Gitleaks**: Automated secret detection in CI/CD
- **Pre-commit hooks**: Prevent commits with secrets
- **Custom rules**: Detect API keys, tokens, and sensitive patterns

### 4. Git History Cleanup

- **BFG Repo-Cleaner**: Remove leaked secrets from git history
- **Force push**: Clean repository after secret removal
- **Collaborator notification**: Re-clone required after cleanup

## 🚫 Prohibited Practices

### ❌ Never Do This

```javascript
// DON'T: Hardcode API keys in client code
const API_KEY = 'AIzaSyA0c40zoJGzs-Eaq5Pn5a80KRDMsyU5d9k';
const response = await fetch(`https://api.google.com?key=${API_KEY}`);
```

```javascript
// DON'T: Store secrets in app configuration
const config = {
  googleKey: 'AIzaSyA0c40zoJGzs-Eaq5Pn5a80KRDMsyU5d9k',
  mapboxSecret: 'sk.1234567890abcdef'
};
```

### ✅ Do This Instead

```javascript
// DO: Use server-side proxies
const response = await apiService.geocodeAddress(query);
const weather = await apiService.getWeatherData(lat, lng);
```

```javascript
// DO: Use environment configuration
import { environment } from '../config/environment';
const apiUrl = environment.API_BASE_URL;
```

## 🔧 Development Setup

### 1. Environment Variables

Create `.env` file for local development:

```bash
cp .env.example .env
# Edit .env with your local values
```

### 2. Pre-commit Hooks

Install pre-commit hooks to prevent secret commits:

```bash
pip install pre-commit
pre-commit install
```

### 3. Secret Scanning

Run Gitleaks locally to check for secrets:

```bash
# Install Gitleaks
# Download from: https://github.com/gitleaks/gitleaks/releases

# Run scan
gitleaks detect --source . --config .gitleaks.toml
```

## 🚨 Incident Response

### If Secrets Are Leaked

1. **Immediate Actions**:
   - Rotate all affected API keys
   - Revoke compromised tokens
   - Check usage logs for unauthorized access

2. **Clean Git History**:
   ```bash
   ./scripts/purge-secrets.sh
   ```

3. **Notify Team**:
   - All collaborators must re-clone the repository
   - Update CI/CD with new keys
   - Review access logs

### Key Rotation Process

1. Generate new API keys
2. Update server environment variables
3. Test with new keys
4. Deploy server changes
5. Update mobile app (if needed)

## 📋 Security Checklist

### Before Committing

- [ ] No hardcoded API keys in code
- [ ] No secrets in configuration files
- [ ] All external calls go through server proxies
- [ ] Environment variables used for configuration
- [ ] Pre-commit hooks installed and working

### Before Release

- [ ] Gitleaks scan passes
- [ ] All secrets in environment variables
- [ ] Server-side proxies implemented
- [ ] API keys have proper scope restrictions
- [ ] Monitoring and alerting configured

### After Release

- [ ] Monitor API usage for anomalies
- [ ] Regular security audits
- [ ] Key rotation schedule established
- [ ] Incident response plan tested

## 🔍 Monitoring

### API Key Monitoring

- Set up usage alerts for unusual patterns
- Monitor for requests from unexpected IPs
- Track quota usage and rate limits

### Secret Detection

- Gitleaks runs on every commit
- GitHub Actions workflow for PRs
- Regular manual scans of the codebase

## 📞 Support

For security concerns or questions:

- Create a private issue in the repository
- Contact the development team
- Follow responsible disclosure practices

## 📚 Resources

- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security-testing-guide/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

---

**Remember**: Security is everyone's responsibility. When in doubt, ask the team before committing sensitive information.
