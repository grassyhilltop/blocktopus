/********************************************************************************
** Form generated from reading UI file 'octoset.ui'
**
** Created by: Qt User Interface Compiler version 4.8.7
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_OCTOSET_H
#define UI_OCTOSET_H

#include <QtCore/QVariant>
#include <QtGui/QAction>
#include <QtGui/QApplication>
#include <QtGui/QButtonGroup>
#include <QtGui/QHeaderView>
#include <QtGui/QLabel>
#include <QtGui/QMainWindow>
#include <QtGui/QMenuBar>
#include <QtGui/QPushButton>
#include <QtGui/QStatusBar>
#include <QtGui/QToolBar>
#include <QtGui/QWidget>

QT_BEGIN_NAMESPACE

class Ui_octoSet
{
public:
    QWidget *centralWidget;
    QPushButton *dig_in;
    QPushButton *ana_out;
    QPushButton *ana_in;
    QPushButton *dig_out;
    QLabel *label;
    QMenuBar *menuBar;
    QToolBar *mainToolBar;
    QStatusBar *statusBar;

    void setupUi(QMainWindow *octoSet)
    {
        if (octoSet->objectName().isEmpty())
            octoSet->setObjectName(QString::fromUtf8("octoSet"));
        octoSet->resize(711, 529);
        centralWidget = new QWidget(octoSet);
        centralWidget->setObjectName(QString::fromUtf8("centralWidget"));
        dig_in = new QPushButton(centralWidget);
        dig_in->setObjectName(QString::fromUtf8("dig_in"));
        dig_in->setGeometry(QRect(50, 130, 251, 101));
        ana_out = new QPushButton(centralWidget);
        ana_out->setObjectName(QString::fromUtf8("ana_out"));
        ana_out->setGeometry(QRect(390, 270, 251, 101));
        ana_in = new QPushButton(centralWidget);
        ana_in->setObjectName(QString::fromUtf8("ana_in"));
        ana_in->setGeometry(QRect(390, 130, 251, 101));
        dig_out = new QPushButton(centralWidget);
        dig_out->setObjectName(QString::fromUtf8("dig_out"));
        dig_out->setGeometry(QRect(50, 270, 251, 101));
        label = new QLabel(centralWidget);
        label->setObjectName(QString::fromUtf8("label"));
        label->setGeometry(QRect(300, 20, 101, 101));
        octoSet->setCentralWidget(centralWidget);
        menuBar = new QMenuBar(octoSet);
        menuBar->setObjectName(QString::fromUtf8("menuBar"));
        menuBar->setGeometry(QRect(0, 0, 711, 25));
        octoSet->setMenuBar(menuBar);
        mainToolBar = new QToolBar(octoSet);
        mainToolBar->setObjectName(QString::fromUtf8("mainToolBar"));
        octoSet->addToolBar(Qt::TopToolBarArea, mainToolBar);
        statusBar = new QStatusBar(octoSet);
        statusBar->setObjectName(QString::fromUtf8("statusBar"));
        octoSet->setStatusBar(statusBar);

        retranslateUi(octoSet);

        QMetaObject::connectSlotsByName(octoSet);
    } // setupUi

    void retranslateUi(QMainWindow *octoSet)
    {
        octoSet->setWindowTitle(QApplication::translate("octoSet", "octoSet", 0, QApplication::UnicodeUTF8));
        dig_in->setText(QApplication::translate("octoSet", "Digital Input", 0, QApplication::UnicodeUTF8));
        ana_out->setText(QApplication::translate("octoSet", "Analog Output", 0, QApplication::UnicodeUTF8));
        ana_in->setText(QApplication::translate("octoSet", "Analog Input", 0, QApplication::UnicodeUTF8));
        dig_out->setText(QApplication::translate("octoSet", "Digital Output", 0, QApplication::UnicodeUTF8));
        label->setText(QApplication::translate("octoSet", "OctoPLug Set", 0, QApplication::UnicodeUTF8));
    } // retranslateUi

};

namespace Ui {
    class octoSet: public Ui_octoSet {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_OCTOSET_H
