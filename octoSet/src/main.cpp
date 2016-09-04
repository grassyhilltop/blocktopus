#include "octoset.h"
#include <QApplication>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    octoSet w;
    w.show();

    return a.exec();
}
