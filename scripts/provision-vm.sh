#!/bin/bash

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Ensure all required environment variables are set
if [ -z "$PROJECT_ID" ] || [ -z "$ZONE" ] || [ -z "$VM_HOST" ] || [ -z "$NETWORK_TAGS" ]; then
    echo "Error: PROJECT_ID, ZONE, VM_HOST, or NETWORK_TAGS environment variables are not set."
    exit 1
fi

echo "--- Ensuring Firewall Rules Exist ---"

# --- For HTTP (Port 80) ---
# ... (rest of your HTTP firewall rule check and creation code) ...
if ! gcloud compute firewall-rules describe default-allow-http --project="${PROJECT_ID}" &> /dev/null; then
    echo "Creating firewall rule 'default-allow-http' for port 80..."
    gcloud compute firewall-rules create default-allow-http \
        --project="${PROJECT_ID}" \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:80 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=http-server \
        --description="Allow incoming HTTP traffic to instances with 'http-server' tag"
else
    echo "Firewall rule 'default-allow-http' already exists."
fi

# --- For HTTPS (Port 443) ---
# ... (rest of your HTTPS firewall rule check and creation code) ...
if ! gcloud compute firewall-rules describe default-allow-https --project="${PROJECT_ID}" &> /dev/null; then
    echo "Creating firewall rule 'default-allow-https' for port 443..."
    gcloud compute firewall-rules create default-allow-https \
        --project="${PROJECT_ID}" \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:443 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=https-server \
        --description="Allow incoming HTTPS traffic to instances with 'https-server' tag"
else
    echo "Firewall rule 'default-allow-https' already exists."
fi

# --- For custom application port 8888 ---
# ... (rest of your app-port-8888 firewall rule check and creation code) ...
if ! gcloud compute firewall-rules describe allow-app-port-8888 --project="${PROJECT_ID}" &> /dev/null; then
    echo "Creating firewall rule 'allow-app-port-8888' for port 8888..."
    gcloud compute firewall-rules create allow-app-port-8888 \
        --project="${PROJECT_ID}" \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:8888 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=app-port-8888 \
        --description="Allow incoming traffic on TCP port 8888 for applications"
else
    echo "Firewall rule 'allow-app-port-8888' already exists."
fi


echo "--- Managing VM Instance ---"

# Check if the VM already exists
if gcloud compute instances describe "${VM_HOST}" --project="${PROJECT_ID}" --zone="${ZONE}" &> /dev/null; then
    echo "VM instance '${VM_HOST}' already exists. Updating network tags."

    # Get current tags to avoid removing others if not specified
    CURRENT_TAGS=$(gcloud compute instances describe "${VM_HOST}" \
                   --project="${PROJECT_ID}" --zone="${ZONE}" \
                   --format="value(tags.items)")

    # Combine current tags with new tags, ensuring no duplicates
    # This example simply adds the specified tags, it doesn't remove existing ones
    # If you want to replace ALL tags, use --tags="${NETWORK_TAGS}"
    # If you want to ADD tags, you'd fetch current tags and append.
    # For simplicity, we'll replace with the full desired list from NETWORK_TAGS
    gcloud compute instances add-tags "${VM_HOST}" \
        --project="${PROJECT_ID}" \
        --zone="${ZONE}" \
        --tags="${NETWORK_TAGS}" # This command will replace any existing tags with the new set.
                                 # If you want to *add* to existing tags, you'd need to fetch them first
                                 # e.g., --tags="${CURRENT_TAGS},${NETWORK_TAGS}" and handle duplicates.
                                 # For this use case, assuming NETWORK_TAGS should be the definitive set.
    echo "Network tags updated for '${VM_HOST}' to: ${NETWORK_TAGS}"

else
    echo "VM instance '${VM_HOST}' does not exist. Creating it."

    gcloud compute instances create "${VM_HOST}" \
        --project="${PROJECT_ID}" \
        --zone="${ZONE}" \
        --machine-type=e2-medium \
        --boot-disk-size=30GB \
        --image-family=ubuntu-2204-lts \
        --image-project=ubuntu-os-cloud \
        --tags="${NETWORK_TAGS}"
    echo "VM instance '${VM_HOST}' created with tags: ${NETWORK_TAGS}"
fi

echo "VM instance and firewall rules setup complete."
