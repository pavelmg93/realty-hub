# 🏗️ Realty Hub: Database & Uploads Sync Reference

This document summarizes the setup for syncing production data from the GCP VM to the local WSL/Docker development environment.

---

## 1. SSH Connectivity (The Foundation)
To avoid typing long IP addresses and managing keys manually, we use an SSH config alias.

**File:** `~/.ssh/config`
```text
Host re-prod
    HostName 35.198.208.152
    User pavelmg93
    IdentityFile ~/.ssh/google_compute_engine
```

### Key Learnings:
* **GCP Identity:** GCP matches keys to users based on the comment at the end of the public key (e.g., `... pavelmg93`). If the comment is just `pavel`, it will create a different Linux user.
* **Passphrase:** Use `eval $(ssh-agent -s) && ssh-add ~/.ssh/google_compute_engine` to avoid typing the passphrase for every sync during a session.

---

## 2. Database Synchronization
**Direction:** Remote Docker Container → Local Docker Container
**Logic:** Stream a compressed custom-format dump over SSH and pipe it directly into the local restore command.

### The Command:
```bash
ssh re-prod "docker exec realty-hub-app-postgres-1 pg_dump -U re_nhatrang -Fc re_nhatrang" \
| docker exec -i realty-hub-app-postgres-1 pg_restore -U re_nhatrang --clean --if-exists -d re_nhatrang --no-owner --no-privileges
```

### Key Flags:
* `-Fc`: Custom format (compressed, required for `pg_restore`).
* `--clean --if-exists`: Drops local tables before recreating them to ensure a 1:1 match.
* `--no-owner`: Prevents errors if the remote DB owner doesn't exist locally.

---

## 3. Image & File Synchronization
**Direction:** VM Host Folder → WSL Host Folder
**Tool:** `rsync` (Differential transfer)

### The Command:
```bash
rsync -rtvzu --progress re-prod:~/realty-hub/uploads/ ./uploads/
```

### Key Learnings:
* **Two-Way Requirement:** `rsync` must be installed on **both** the local machine and the VM (`sudo apt install rsync`).
* **Trailing Slashes:** Using `uploads/` (with a slash) syncs the *contents* of the folder. Omitting the slash would create a nested `uploads/uploads/` folder.
* **Permissions:** If you see `Permission Denied (13)`, reset local WSL ownership:
  `sudo chown -R $USER:$USER ./uploads`

---

## 4. Troubleshooting Checklist

| Error | Cause | Fix |
| :--- | :--- | :--- |
| `Hostname invalid` | Spaces/Path in SSH string | Clean `VM_HOST` variable in script |
| `Permission denied (publickey)` | Key not in GCP Metadata | Paste `.pub` key into GCP Console for user `pavelmg93` |
| `input file is too short` | SSH failed (0 bytes sent) | Fix SSH connection first |
| `rsync: command not found` | Missing binary on VM | `sudo apt install rsync` on the VM |
| `mkstemp failed` | Local folder permissions | `sudo chown -R $USER:$USER ./uploads` |

---

## 5. Summary of Scripts
* `scripts/sync-db.sh`: Handles the Postgres dump and restore.
* `scripts/sync-uploads.sh`: Handles the `rsync` of images/documents.