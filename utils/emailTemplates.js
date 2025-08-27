export const getPurchaseConfirmationTemplate = (userName, robotName, robotIcon, amount, keviumBalance) => `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation d'Achat - KevMine</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f4f8;
            color: #333;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }
        .header {
            background-color: #0d1b2a;
            color: #fff;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin-top: 10px;
            font-size: 16px;
            opacity: 0.8;
        }
        .content {
            padding: 30px;
            text-align: center;
        }
        .content h2 {
            color: #4CAF50;
            font-size: 24px;
            margin-top: 0;
        }
        .robot-info {
            background-color: #e8f5e9;
            border-left: 5px solid #4CAF50;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            text-align: center;
        }
        .robot-info img {
            width: 80px;
            height: 80px;
            margin-bottom: 15px;
        }
        .robot-info p {
            margin: 5px 0;
            font-size: 18px;
            font-weight: 500;
        }
        .details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: left;
            font-size: 16px;
        }
        .details table {
            width: 100%;
            border-collapse: collapse;
        }
        .details th, .details td {
            padding: 12px 15px;
            border-bottom: 1px solid #dee2e6;
        }
        .details th {
            text-align: left;
            font-weight: 600;
            color: #555;
        }
        .details td {
            text-align: right;
            font-weight: 400;
        }
        .total {
            font-size: 20px;
            font-weight: bold;
            color: #0d1b2a;
            padding-top: 10px;
            border-top: 2px solid #0d1b2a;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #777;
            background-color: #e9ecef;
            border-top: 1px solid #dee2e6;
        }
        .footer a {
            color: #0d1b2a;
            text-decoration: none;
            font-weight: 500;
        }
        .highlight {
            color: #4CAF50;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Achat Réussi !</h1>
            <p>Félicitations, ${userName} ! Votre transaction est confirmée.</p>
        </div>
        <div class="content">
            <h2>Votre nouveau robot vous attend !</h2>
            <div class="robot-info">
                <img src="${robotIcon}" alt="${robotName}">
                <p><strong>${robotName}</strong></p>
                <p>Prêt à miner du Kevium !</p>
            </div>
            <div class="details">
                <table>
                    <tbody>
                        <tr>
                            <th>Montant de l'achat</th>
                            <td><span class="highlight">${amount}</span> KVM</td>
                        </tr>
                        <tr>
                            <th>Nouveau Solde Kevium</th>
                            <td><span class="highlight">${keviumBalance}</span> KVM</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p style="font-size:15px; margin-top:25px;">Rendez-vous sur votre profil pour le voir en action !</p>
        </div>
        <div class="footer">
            <p>Si vous avez des questions, n'hésitez pas à contacter le <a href="mailto:support@kev-mine.com">support KevMine</a>.</p>
            <p>&copy; 2025 KevMine. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>
`;

export const getStatusChangeTemplate = (userName, newStatus, message) => {
    let statusTitle;
    let statusColor;
    switch (newStatus) {
        case 'active':
            statusTitle = 'Compte Réactivé';
            statusColor = '#4CAF50'; // Green
            break;
        case 'banned':
            statusTitle = 'Compte Banni';
            statusColor = '#f44336'; // Red
            break;
        case 'temporarily_suspended':
            statusTitle = 'Compte Suspendu Temporairement';
            statusColor = '#ff9800'; // Orange
            break;
        case 'promoted_to_admin':
            statusTitle = 'Promotion Admin';
            statusColor = '#2196F3'; // Blue
            break;
        default:
            statusTitle = 'Mise à jour de Statut de Compte';
            statusColor = '#607D8B'; // Grey
            break;
    }
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mise à jour de Statut de Compte - KevMine</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f0f4f8;
                color: #333;
                margin: 0;
                padding: 0;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                overflow: hidden;
            }
            .header {
                background-color: ${statusColor};
                color: #fff;
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .header p {
                margin-top: 10px;
                font-size: 16px;
                opacity: 0.8;
            }
            .content {
                padding: 30px;
                text-align: center;
            }
            .content h2 {
                color: ${statusColor};
                font-size: 24px;
                margin-top: 0;
            }
            .message-box {
                background-color: #f8f9fa;
                border-left: 5px solid ${statusColor};
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
                text-align: left;
            }
            .message-box p {
                margin: 0;
                font-size: 16px;
            }
            .footer {
                text-align: center;
                padding: 20px;
                font-size: 14px;
                color: #777;
                background-color: #e9ecef;
                border-top: 1px solid #dee2e6;
            }
            .footer a {
                color: ${statusColor};
                text-decoration: none;
                font-weight: 500;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${statusTitle}</h1>
                <p>Bonjour ${userName}, une mise à jour a été faite sur votre compte KevMine.</p>
            </div>
            <div class="content">
                <h2>Statut de votre compte : <span style="color:${statusColor}">${newStatus.toUpperCase()}</span></h2>
                <div class="message-box">
                    <p><strong>Message de l'administration :</strong></p>
                    <p>${message}</p>
                </div>
                <p style="font-size:15px; margin-top:25px;">Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.</p>
            </div>
            <div class="footer">
                <p>Contact : <a href="mailto:support@kev-mine.com">support@kev-mine.com</a></p>
                <p>&copy; 2025 KevMine. Tous droits réservés.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};