"""
E-Waste Vision Classifier — fine-tuning script (MobileNetV3-Small).
Usage: python ml/ewaste/train.py --data_dir /path/to/ewaste_images
       Dataset should follow ImageFolder convention:
           data_dir/
               laptop/  image1.jpg ...
               battery/ image1.jpg ...
               ...
Outputs: ml/artefacts/ewaste_classifier.pt
"""
import os
import argparse
import time

ARTEFACT_DIR = os.path.join(os.path.dirname(__file__), '..', 'artefacts')
os.makedirs(ARTEFACT_DIR, exist_ok=True)

CLASSES = [
    'battery', 'cable_wire', 'crt_monitor', 'keyboard_mouse',
    'laptop', 'lighting_bulb', 'mobile_phone', 'pcb_circuit_board',
    'power_adapter', 'printer_cartridge',
]


def train(data_dir: str, epochs: int = 10, batch_size: int = 32, lr: float = 1e-3):
    try:
        import torch
        import torch.nn as nn
        from torch.utils.data import DataLoader, random_split
        from torchvision import datasets, transforms, models
    except ImportError:
        print("PyTorch / torchvision not installed. Run: pip install torch torchvision")
        return

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Device: {device}")

    transform_train = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    transform_val = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    full = datasets.ImageFolder(data_dir, transform=transform_train)
    val_size  = int(0.2 * len(full))
    train_size = len(full) - val_size
    train_ds, val_ds = random_split(full, [train_size, val_size])
    val_ds.dataset.transform = transform_val

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True,  num_workers=2)
    val_loader   = DataLoader(val_ds,   batch_size=batch_size, shuffle=False, num_workers=2)

    # MobileNetV3-Small backbone, replace classifier head
    model = models.mobilenet_v3_small(weights='IMAGENET1K_V1')
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, len(CLASSES))
    model = model.to(device)

    # Freeze backbone; only train classifier
    for name, p in model.named_parameters():
        if 'classifier' not in name:
            p.requires_grad = False

    criterion  = nn.CrossEntropyLoss()
    optimizer  = torch.optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=lr)
    scheduler  = torch.optim.lr_scheduler.StepLR(optimizer, step_size=4, gamma=0.5)

    best_acc = 0.0
    for epoch in range(epochs):
        model.train()
        total_loss, correct, total = 0, 0, 0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()
            out  = model(imgs)
            loss = criterion(out, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * imgs.size(0)
            correct    += (out.argmax(1) == labels).sum().item()
            total      += imgs.size(0)
        scheduler.step()

        # Validation
        model.eval()
        val_correct, val_total = 0, 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(device), labels.to(device)
                out = model(imgs)
                val_correct += (out.argmax(1) == labels).sum().item()
                val_total   += imgs.size(0)

        train_acc = correct / total
        val_acc   = val_correct / val_total
        print(f"Epoch {epoch+1:02d}/{epochs}  loss={total_loss/total:.4f}  train_acc={train_acc:.3f}  val_acc={val_acc:.3f}")

        if val_acc > best_acc:
            best_acc = val_acc
            out_path = os.path.join(ARTEFACT_DIR, 'ewaste_classifier.pt')
            torch.save({'model_state': model.state_dict(), 'classes': CLASSES, 'arch': 'mobilenet_v3_small'}, out_path)
            print(f"  ✓ Saved best model (val_acc={val_acc:.3f}) → {out_path}")

    print(f"\nTraining complete. Best val accuracy: {best_acc:.3f}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--data_dir', type=str, required=True, help='Path to ImageFolder dataset')
    parser.add_argument('--epochs',   type=int, default=10)
    parser.add_argument('--batch',    type=int, default=32)
    parser.add_argument('--lr',       type=float, default=1e-3)
    args = parser.parse_args()
    train(args.data_dir, args.epochs, args.batch, args.lr)
